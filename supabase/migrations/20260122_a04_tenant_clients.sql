-- ============================================================================
-- TICKET A-04: Módulo Clientes (tenant_clients)
-- ============================================================================
-- Tabla multi-tenant para gestión de clientes
-- ============================================================================

-- 1. Crear tabla tenant_clients
CREATE TABLE IF NOT EXISTS public.tenant_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NULL,
    phone text NULL,
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_tenant_clients_tenant_id 
ON public.tenant_clients(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_clients_tenant_name 
ON public.tenant_clients(tenant_id, name);

-- 3. Crear función para updated_at (si no existe)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para updated_at
DROP TRIGGER IF EXISTS set_tenant_clients_updated_at ON public.tenant_clients;

CREATE TRIGGER set_tenant_clients_updated_at
    BEFORE UPDATE ON public.tenant_clients
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 5. Habilitar RLS
ALTER TABLE public.tenant_clients ENABLE ROW LEVEL SECURITY;

-- 6. Policies RLS

-- SELECT: Usuarios autenticados pueden ver clientes de su tenant
CREATE POLICY tenant_clients_select_own_tenant
ON public.tenant_clients
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

-- INSERT: Solo Admin y Operador pueden crear clientes
CREATE POLICY tenant_clients_insert_admin_operador
ON public.tenant_clients
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

-- UPDATE: Solo Admin y Operador pueden actualizar clientes
CREATE POLICY tenant_clients_update_admin_operador
ON public.tenant_clients
FOR UPDATE
TO authenticated
USING (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.role_key IN ('Admin', 'Operador')
        AND tu.is_active = true
    )
);

-- DELETE: Solo Admin puede eliminar clientes
CREATE POLICY tenant_clients_delete_admin
ON public.tenant_clients
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

-- 7. Verificar que todo se creó correctamente
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE tablename = 'tenant_clients';

SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'tenant_clients'
ORDER BY policyname;
