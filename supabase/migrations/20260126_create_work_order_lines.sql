-- ============================================================================
-- MIGRACIÓN A-07.3 (PARCIAL) — Work Order Lines + Totales
-- ============================================================================
-- Objetivo: Permitir agregar líneas de productos/servicios a Work Orders
--           SIN dependencias de inventario (implementación parcial)
-- Fecha: 2026-01-25
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. FUNCIONES HELPER (si no existen)
-- ----------------------------------------------------------------------------

-- Helper: obtener tenant_id activo del usuario autenticado
CREATE OR REPLACE FUNCTION public.active_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
  
  RETURN v_tenant_id;
END $$;

-- Helper: verificar si un tenant_id es el activo del usuario
CREATE OR REPLACE FUNCTION public.is_active_tenant(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND is_active = true
  );
END $$;

-- Helper: verificar si el usuario tiene alguno de los roles especificados
CREATE OR REPLACE FUNCTION public.has_tenant_role(p_tenant_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = auth.uid()
      AND tenant_id = p_tenant_id
      AND is_active = true
      AND role_key = ANY(p_roles)
  );
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLA: tenant_work_order_lines
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_work_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.tenant_work_orders(id) ON DELETE CASCADE,

  -- Tipo de línea: SERVICE o MATERIAL
  kind TEXT NOT NULL CHECK (kind IN ('SERVICE', 'MATERIAL')),
  
  -- Snapshot de datos (sin FK a catálogo)
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  
  -- Cantidades y precios
  qty NUMERIC(14,4) NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
  
  -- Totales calculados
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  
  -- Auditoría
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_work_order_lines_wo 
  ON public.tenant_work_order_lines(tenant_id, work_order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_order_lines_kind 
  ON public.tenant_work_order_lines(tenant_id, kind);

COMMENT ON TABLE public.tenant_work_order_lines IS 'Líneas de productos/servicios en Work Orders (sin integración de inventario)';
COMMENT ON COLUMN public.tenant_work_order_lines.kind IS 'Tipo: SERVICE (mano de obra) o MATERIAL (refacciones)';
COMMENT ON COLUMN public.tenant_work_order_lines.line_total IS 'qty * unit_price';
COMMENT ON COLUMN public.tenant_work_order_lines.cost_total IS 'qty * cost_unit';

-- ----------------------------------------------------------------------------
-- 3. AGREGAR CAMPOS DE TOTALES A tenant_work_orders
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenant_work_orders
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_materials NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_services NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin NUMERIC(14,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tenant_work_orders.subtotal IS 'Suma de line_total de todas las líneas';
COMMENT ON COLUMN public.tenant_work_orders.total IS 'subtotal + tax_total';
COMMENT ON COLUMN public.tenant_work_orders.cost_materials IS 'Suma de cost_total donde kind=MATERIAL';
COMMENT ON COLUMN public.tenant_work_orders.cost_services IS 'Suma de cost_total donde kind=SERVICE';
COMMENT ON COLUMN public.tenant_work_orders.margin IS 'total - cost_total';

-- ----------------------------------------------------------------------------
-- 4. FUNCIÓN: Recalcular totales de Work Order
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fx_work_order_recalc_totals(
  p_tenant_id UUID,
  p_work_order_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_subtotal NUMERIC(14,2);
  v_cost_materials NUMERIC(14,2);
  v_cost_services NUMERIC(14,2);
BEGIN
  -- Calcular totales desde las líneas
  SELECT
    COALESCE(SUM(line_total), 0)::NUMERIC(14,2),
    COALESCE(SUM(cost_total) FILTER (WHERE kind = 'MATERIAL'), 0)::NUMERIC(14,2),
    COALESCE(SUM(cost_total) FILTER (WHERE kind = 'SERVICE'), 0)::NUMERIC(14,2)
  INTO v_subtotal, v_cost_materials, v_cost_services
  FROM public.tenant_work_order_lines
  WHERE tenant_id = p_tenant_id
    AND work_order_id = p_work_order_id;

  -- Actualizar Work Order
  UPDATE public.tenant_work_orders
  SET 
    subtotal = v_subtotal,
    tax_total = 0, -- Por ahora sin impuestos
    total = v_subtotal,
    cost_materials = v_cost_materials,
    cost_services = v_cost_services,
    cost_total = (v_cost_materials + v_cost_services),
    margin = (v_subtotal - (v_cost_materials + v_cost_services)),
    updated_at = NOW()
  WHERE id = p_work_order_id
    AND tenant_id = p_tenant_id;
END $$;

-- ----------------------------------------------------------------------------
-- 5. RPC: Agregar línea a Work Order (versión básica)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_work_order_add_line_basic(
  p_work_order_id UUID,
  p_kind TEXT,
  p_name TEXT,
  p_qty NUMERIC,
  p_unit TEXT DEFAULT 'unit',
  p_unit_price NUMERIC DEFAULT 0,
  p_cost_unit NUMERIC DEFAULT 0
)
RETURNS TABLE (
  line_id UUID,
  subtotal NUMERIC,
  total NUMERIC,
  cost_total NUMERIC,
  margin NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id UUID;
  v_line_id UUID;
  v_line_total NUMERIC(14,2);
  v_cost_total NUMERIC(14,2);
BEGIN
  -- Obtener tenant activo
  v_tenant_id := public.active_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No active tenant for user' USING ERRCODE = '42501';
  END IF;

  -- Validar que la Work Order pertenece al tenant activo
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_work_orders
    WHERE id = p_work_order_id AND tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'Work Order not found or not in active tenant' USING ERRCODE = '23503';
  END IF;

  -- Validaciones
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'qty must be > 0' USING ERRCODE = '22023';
  END IF;

  IF p_kind NOT IN ('SERVICE', 'MATERIAL') THEN
    RAISE EXCEPTION 'kind must be SERVICE or MATERIAL' USING ERRCODE = '22023';
  END IF;

  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'name is required' USING ERRCODE = '22023';
  END IF;

  -- Calcular totales de la línea
  v_line_total := ROUND((p_qty * p_unit_price)::NUMERIC, 2);
  v_cost_total := ROUND((p_qty * p_cost_unit)::NUMERIC, 2);

  -- Insertar línea
  INSERT INTO public.tenant_work_order_lines (
    tenant_id,
    work_order_id,
    kind,
    name,
    unit,
    qty,
    unit_price,
    cost_unit,
    line_total,
    cost_total,
    created_by
  ) VALUES (
    v_tenant_id,
    p_work_order_id,
    p_kind,
    p_name,
    p_unit,
    p_qty,
    p_unit_price,
    p_cost_unit,
    v_line_total,
    v_cost_total,
    auth.uid()
  ) RETURNING id INTO v_line_id;

  -- Recalcular totales de la Work Order
  PERFORM public.fx_work_order_recalc_totals(v_tenant_id, p_work_order_id);

  -- Retornar line_id y totales actualizados
  RETURN QUERY
  SELECT 
    v_line_id,
    wo.subtotal,
    wo.total,
    wo.cost_total,
    wo.margin
  FROM public.tenant_work_orders wo
  WHERE wo.id = p_work_order_id 
    AND wo.tenant_id = v_tenant_id;
END $$;

-- ----------------------------------------------------------------------------
-- 6. RLS POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenant_work_order_lines ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier usuario del tenant activo
DROP POLICY IF EXISTS "Tenant members can view WO lines" ON public.tenant_work_order_lines;
CREATE POLICY "Tenant members can view WO lines"
  ON public.tenant_work_order_lines
  FOR SELECT TO authenticated
  USING (public.is_active_tenant(tenant_id));

-- INSERT: Admin, Supervisor, Tecnico
DROP POLICY IF EXISTS "Staff can insert WO lines" ON public.tenant_work_order_lines;
CREATE POLICY "Staff can insert WO lines"
  ON public.tenant_work_order_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_tenant_role(tenant_id, ARRAY['Admin', 'Supervisor', 'Tecnico'])
  );

-- UPDATE/DELETE: bloqueados (histórico inmutable en Fase I)
-- Solo Admin puede modificar via SQL directo si es necesario

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecutar estas queries para validar:
-- 
-- 1) Verificar que las funciones helper existen:
--    SELECT proname FROM pg_proc WHERE proname IN ('active_tenant_id', 'is_active_tenant', 'has_tenant_role');
--
-- 2) Verificar que la tabla tiene las columnas correctas:
--    SELECT column_name, data_type FROM information_schema.columns 
--    WHERE table_name = 'tenant_work_order_lines' ORDER BY ordinal_position;
--
-- 3) Verificar que tenant_work_orders tiene los campos de totales:
--    SELECT column_name FROM information_schema.columns 
--    WHERE table_name = 'tenant_work_orders' AND column_name IN ('subtotal', 'total', 'margin');
--
-- 4) Probar agregar una línea de servicio:
--    SELECT * FROM api_work_order_add_line_basic(
--      p_work_order_id := '<work_order_id>',
--      p_kind := 'SERVICE',
--      p_name := 'Mano de obra técnica',
--      p_qty := 2,
--      p_unit := 'hora',
--      p_unit_price := 500,
--      p_cost_unit := 200
--    );
--
-- ============================================================================
-- FIN MIGRACIÓN A-07.3 (PARCIAL)
-- ============================================================================
