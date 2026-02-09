-- ============================================================================
-- MIGRACIÓN AG: A-07.2-RLS-02 — Operador → Supervisor
-- ============================================================================
-- Objetivo: Renombrar rol 'Operador' a 'Supervisor' y agregar rol 'Contador'
-- Fecha: 2026-01-25
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1: Quitar CHECK actual
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenant_users
DROP CONSTRAINT IF EXISTS tenant_users_role_key_check;

-- ----------------------------------------------------------------------------
-- PASO 2: Migrar datos existentes (CRÍTICO - antes de recrear CHECK)
-- ----------------------------------------------------------------------------
UPDATE public.tenant_users
SET role_key = 'Supervisor'
WHERE role_key = 'Operador';

-- ----------------------------------------------------------------------------
-- PASO 3: Normalizar espacios (sin cambiar mayúsculas)
-- ----------------------------------------------------------------------------
UPDATE public.tenant_users
SET role_key = TRIM(role_key)
WHERE role_key <> TRIM(role_key);

-- ----------------------------------------------------------------------------
-- PASO 4: Crear nuevo CHECK definitivo
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenant_users
ADD CONSTRAINT tenant_users_role_key_check
CHECK (
  role_key = ANY (ARRAY[
    'Admin'::text,
    'Supervisor'::text,
    'Tecnico'::text,
    'Lectura'::text,
    'Contador'::text
  ])
);

-- ----------------------------------------------------------------------------
-- PASO 5: Trigger preventivo (auto-trim)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_tenant_users_trim_role_key()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role_key IS NOT NULL THEN
    NEW.role_key := TRIM(NEW.role_key);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tenant_users_trim_role_key ON public.tenant_users;
CREATE TRIGGER trg_tenant_users_trim_role_key
BEFORE INSERT OR UPDATE ON public.tenant_users
FOR EACH ROW EXECUTE FUNCTION public.trg_tenant_users_trim_role_key();

-- ============================================================================
-- ACTUALIZACIÓN DE POLICIES RLS EXISTENTES
-- ============================================================================
-- Las siguientes policies contienen referencias hardcoded a 'Operador'
-- Se recrean con 'Supervisor' en su lugar
-- NOTA: Solo se actualizan tablas que existen actualmente en la BD
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tenant_work_orders (20260125_create_work_orders.sql)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can create WO" ON public.tenant_work_orders;
CREATE POLICY "Staff can create WO" ON public.tenant_work_orders
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_work_orders.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key IN ('Admin', 'Supervisor', 'Tecnico')
        )
    );

DROP POLICY IF EXISTS "Staff can update WO" ON public.tenant_work_orders;
CREATE POLICY "Staff can update WO" ON public.tenant_work_orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_work_orders.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key IN ('Admin', 'Supervisor', 'Tecnico')
        )
    );

-- ----------------------------------------------------------------------------
-- tenant_work_order_events (20260126_create_work_order_events.sql)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant members can view work order events" ON public.tenant_work_order_events;
CREATE POLICY "Tenant members can view work order events" ON public.tenant_work_order_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.tenant_work_orders wo
            JOIN public.tenant_users tu ON tu.tenant_id = wo.tenant_id
            WHERE wo.id = tenant_work_order_events.work_order_id
                AND tu.user_id = auth.uid()
                AND tu.is_active = true
                AND (
                    tu.role_key IN ('Admin', 'Supervisor', 'Lectura')
                    OR
                    (tu.role_key = 'Tecnico' AND wo.assigned_to = auth.uid())
                )
        )
    );

-- ----------------------------------------------------------------------------
-- tenant_service_types (20260126_create_service_types.sql)
-- ----------------------------------------------------------------------------
-- La migración original usa una sola policy "Admin/Operador can manage service types" FOR ALL
-- La reemplazamos con una que use 'Supervisor'
DROP POLICY IF EXISTS "Admin/Operador can manage service types" ON public.tenant_service_types;
CREATE POLICY "Admin/Supervisor can manage service types" ON public.tenant_service_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_service_types.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key IN ('Admin', 'Supervisor')
        )
    );


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecutar estas queries para validar la migración:
-- 
-- 1) Verificar que no existan registros con 'Operador':
--    SELECT COUNT(*) FROM tenant_users WHERE role_key = 'Operador';
--    -- Debe retornar 0
--
-- 2) Verificar el nuevo constraint:
--    SELECT conname, pg_get_constraintdef(oid) 
--    FROM pg_constraint 
--    WHERE conname = 'tenant_users_role_key_check';
--
-- 3) Verificar que todos los registros tengan roles válidos:
--    SELECT role_key, COUNT(*) 
--    FROM tenant_users 
--    GROUP BY role_key;
--
-- ============================================================================
-- FIN MIGRACIÓN AG: A-07.2-RLS-02
-- ============================================================================

