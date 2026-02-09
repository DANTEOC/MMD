-- Permitir que Admin vea todos los usuarios de su tenant
DROP POLICY IF EXISTS tenant_users_select_same_tenant ON public.tenant_users;

CREATE POLICY tenant_users_select_same_tenant
ON public.tenant_users
FOR SELECT
TO authenticated
USING (
    -- Ver propios registros
    user_id = auth.uid()
    OR
    -- O si eres Admin del mismo tenant
    tenant_id IN (
        SELECT t.id 
        FROM public.tenants t
        WHERE EXISTS (
            SELECT 1 
            FROM public.tenant_users tu
            WHERE tu.tenant_id = t.id
            AND tu.user_id = auth.uid()
            AND tu.role_key = 'Admin'
            AND tu.is_active = true
        )
    )
);

-- Verificar
SELECT policyname FROM pg_policies WHERE tablename = 'tenant_users';
