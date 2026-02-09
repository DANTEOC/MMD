-- SOLUCIÓN TEMPORAL: Deshabilitar RLS en tenant_users
-- Esto permite que la aplicación gestione usuarios sin restricciones RLS
-- La seguridad se maneja en app layer con requireAdmin()

ALTER TABLE public.tenant_users DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tenant_users';
