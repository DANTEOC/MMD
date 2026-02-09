-- Migration: Integrate Work Orders with Inventory
-- Description: Link work order lines to inventory movements for traceability

-- 1. Add inventory_movement_id to work order lines
ALTER TABLE public.tenant_work_order_lines 
ADD COLUMN IF NOT EXISTS inventory_movement_id UUID REFERENCES public.tenant_inventory_movements(id);

CREATE INDEX IF NOT EXISTS idx_wo_lines_movement ON public.tenant_work_order_lines(inventory_movement_id);

-- 2. Update RPC to accept inventory_movement_id
CREATE OR REPLACE FUNCTION public.api_work_order_add_line_v2(
  p_work_order_id UUID,
  p_kind TEXT,
  p_name TEXT,
  p_qty NUMERIC,
  p_unit TEXT DEFAULT 'unit',
  p_unit_price NUMERIC DEFAULT 0,
  p_cost_unit NUMERIC DEFAULT 0,
  p_inventory_movement_id UUID DEFAULT NULL
)
RETURNS TABLE (
  line_id UUID,
  subtotal NUMERIC,
  total NUMERIC,
  cost_total NUMERIC,
  margin NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_line_id UUID;
  v_line_total NUMERIC(14,2);
  v_cost_total NUMERIC(14,2);
BEGIN
  -- Obtener tenant activo
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_users
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;

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
    created_by,
    inventory_movement_id
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
    auth.uid(),
    p_inventory_movement_id
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
