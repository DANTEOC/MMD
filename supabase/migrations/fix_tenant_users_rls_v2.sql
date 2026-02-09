-- ============================================================================
-- FIX v2: Policies sin recursión para tenant_users
-- ============================================================================
-- Solución: Usar solo auth.uid() sin subconsultas a tenant_users
-- ============================================================================

-- 1. Eliminar todas las policies
DROP POLICY IF EXISTS tenant_users_select_own ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_select_same_tenant ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_insert_admin ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_update_admin ON public.tenant_users;
DROP POLICY IF EXISTS tenant_users_delete_admin ON public.tenant_users;

-- 2. Policy simple: Los usuarios solo ven sus propios registros
CREATE POLICY tenant_users_select_own 
ON public.tenant_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. INSERT: Permitir a usuarios autenticados (validación en app)
CREATE POLICY tenant_users_insert_any
ON public.tenant_users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. UPDATE: Solo el propio usuario puede actualizar sus registros
CREATE POLICY tenant_users_update_own
ON public.tenant_users
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 5. DELETE: Solo el propio usuario puede eliminar sus registros
CREATE POLICY tenant_users_delete_own
ON public.tenant_users
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 6. Re-habilitar RLS
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 7. Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tenant_users';
