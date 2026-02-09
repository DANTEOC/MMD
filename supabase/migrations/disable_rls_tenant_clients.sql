-- Deshabilitar RLS temporalmente en tenant_clients para desarrollo
ALTER TABLE public.tenant_clients DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tenant_clients';
