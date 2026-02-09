-- Eliminar TODAS las policies de tenant_users
DROP POLICY IF EXISTS tenant_users_select_own ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_select_same_tenant ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_insert_admin ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_insert_authenticated ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_update_admin ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_update_authenticated ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_delete_admin ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_delete_authenticated ON public.tenant_users;

-- SELECT: Ver propios registros
CREATE POLICY tenant_users_select_own
ON public.tenant_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- INSERT: Permitir a autenticados (validación en app)
CREATE POLICY tenant_users_insert_authenticated
ON public.tenant_users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: Permitir a autenticados (validación en app)
CREATE POLICY tenant_users_update_authenticated
ON public.tenant_users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: Permitir a autenticados (validación en app)
CREATE POLICY tenant_users_delete_authenticated
ON public.tenant_users
FOR DELETE
TO authenticated
USING (true);

-- Verificar
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'tenant_users'
ORDER BY policyname;
