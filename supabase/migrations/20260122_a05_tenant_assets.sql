-- ============================================================================
-- TICKET A-05: Módulo Activos/Embarcaciones (tenant_assets)
-- ============================================================================
-- Tabla multi-tenant para gestión de activos asociados a clientes
-- ============================================================================

-- 1. Crear tabla tenant_assets
CREATE TABLE IF NOT EXISTS public.tenant_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.tenant_clients(id) ON DELETE RESTRICT,
    name text NOT NULL,
    asset_type text NOT NULL,
    make text NULL,
    model text NULL,
    year int NULL,
    serial text NULL,
    notes text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_tenant_assets_tenant_id 
ON public.tenant_assets(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_assets_client_id 
ON public.tenant_assets(client_id);

CREATE INDEX IF NOT EXISTS idx_tenant_assets_tenant_type 
ON public.tenant_assets(tenant_id, asset_type);

-- 3. Crear trigger para updated_at (reutilizar función existente)
DROP TRIGGER IF EXISTS set_tenant_assets_updated_at ON public.tenant_assets;

CREATE TRIGGER set_tenant_assets_updated_at
    BEFORE UPDATE ON public.tenant_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.tenant_assets ENABLE ROW LEVEL SECURITY;

-- 5. Policies RLS

-- SELECT: Usuarios autenticados pueden ver activos de su tenant
CREATE POLICY tenant_assets_select_own_tenant
ON public.tenant_assets
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

-- INSERT: Admin, Operador y Tecnico pueden crear activos
CREATE POLICY tenant_assets_insert_allowed_roles
ON public.tenant_assets
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.role_key IN ('Admin', 'Operador', 'Tecnico')
        AND tu.is_active = true
    )
);

-- UPDATE: Admin, Operador y Tecnico pueden actualizar activos
CREATE POLICY tenant_assets_update_allowed_roles
ON public.tenant_assets
FOR UPDATE
TO authenticated
USING (
    tenant_id IN (
        SELECT tu.tenant_id
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.role_key IN ('Admin', 'Operador', 'Tecnico')
        AND tu.is_active = true
    )
);

-- DELETE: Solo Admin puede eliminar activos
CREATE POLICY tenant_assets_delete_admin
ON public.tenant_assets
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
WHERE tablename = 'tenant_assets';

SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'tenant_assets'
ORDER BY policyname;
