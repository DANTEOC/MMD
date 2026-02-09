-- ============================================================================
-- TICKET A-06: Módulo Órdenes de Servicio (tenant_work_orders)
-- ============================================================================
-- Tabla multi-tenant para gestión de órdenes de servicio
-- ============================================================================

-- 1. Crear tabla tenant_work_orders
CREATE TABLE IF NOT EXISTS public.tenant_work_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.tenant_clients(id) ON DELETE RESTRICT,
    asset_id uuid NULL REFERENCES public.tenant_assets(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text NULL,
    status text NOT NULL DEFAULT 'open',
    assigned_to uuid NULL REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled'))
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_tenant_work_orders_tenant_id 
ON public.tenant_work_orders(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_work_orders_status 
ON public.tenant_work_orders(status);

CREATE INDEX IF NOT EXISTS idx_tenant_work_orders_assigned_to 
ON public.tenant_work_orders(assigned_to);

CREATE INDEX IF NOT EXISTS idx_tenant_work_orders_client_id 
ON public.tenant_work_orders(client_id);

-- 3. Crear trigger para updated_at
DROP TRIGGER IF EXISTS set_tenant_work_orders_updated_at ON public.tenant_work_orders;

CREATE TRIGGER set_tenant_work_orders_updated_at
    BEFORE UPDATE ON public.tenant_work_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.tenant_work_orders ENABLE ROW LEVEL SECURITY;

-- 5. Policies RLS

-- SELECT: Cualquier miembro del tenant puede ver órdenes
CREATE POLICY tenant_work_orders_select_own_tenant
ON public.tenant_work_orders
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
    )
);

-- INSERT: Solo Admin y Operador pueden crear órdenes
CREATE POLICY tenant_work_orders_insert_admin_operador
ON public.tenant_work_orders
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.role_key IN ('Admin', 'Operador')
        AND tu.is_active = true
    )
);

-- UPDATE: Admin/Operador pueden actualizar todo, Tecnico solo si está asignado
CREATE POLICY tenant_work_orders_update_allowed
ON public.tenant_work_orders
FOR UPDATE
TO authenticated
USING (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.is_active = true
        AND (
            -- Admin y Operador pueden actualizar cualquier orden
            tu.role_key IN ('Admin', 'Operador')
            OR
            -- Tecnico solo si está asignado a la orden
            (tu.role_key = 'Tecnico' AND tenant_work_orders.assigned_to = auth.uid())
        )
    )
);

-- DELETE: Solo Admin puede eliminar órdenes
CREATE POLICY tenant_work_orders_delete_admin
ON public.tenant_work_orders
FOR DELETE
TO authenticated
USING (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
);

-- 6. Verificar que todo se creó correctamente
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename = 'tenant_work_orders';

SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'tenant_work_orders'
ORDER BY policyname;
