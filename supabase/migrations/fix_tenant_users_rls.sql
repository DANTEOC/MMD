-- ============================================================================
-- FIX: Corregir recursión infinita en policies de tenant_users
-- ============================================================================
-- Problema: Las policies actuales causan recursión infinita
-- Solución: Usar policies simples sin llamadas a funciones recursivas
-- ============================================================================

-- 1. Eliminar todas las policies existentes de tenant_users
DROP POLICY IF EXISTS tenant_users_select_own ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_select_admin_of_tenant ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_select_same_tenant ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_insert_admin_of_tenant ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_update_admin_of_tenant ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_delete_admin_of_tenant ON public.tenant_users;

-- 2. Crear policies simples sin recursión

-- SELECT: Los usuarios pueden ver sus propios registros
CREATE POLICY tenant_users_select_own 
ON public.tenant_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: Los usuarios pueden ver otros usuarios del mismo tenant
-- (sin usar funciones que consulten tenant_users)
CREATE POLICY tenant_users_select_same_tenant
ON public.tenant_users
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

-- INSERT: Solo admins pueden agregar usuarios a su tenant
CREATE POLICY tenant_users_insert_admin
ON public.tenant_users
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_users.tenant_id
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
);

-- UPDATE: Solo admins pueden modificar usuarios de su tenant
CREATE POLICY tenant_users_update_admin
ON public.tenant_users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_users.tenant_id
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
);

-- DELETE: Solo admins pueden eliminar usuarios de su tenant
CREATE POLICY tenant_users_delete_admin
ON public.tenant_users
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.tenant_users tu
        WHERE tu.user_id = auth.uid()
        AND tu.tenant_id = tenant_users.tenant_id
        AND tu.role_key = 'Admin'
        AND tu.is_active = true
    )
);

-- 3. Re-habilitar RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 4. Verificar que las policies se crearon correctamente
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'tenant_users'
ORDER BY policyname;
