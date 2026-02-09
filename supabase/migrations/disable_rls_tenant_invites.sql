-- Deshabilitar RLS en tenant_invites para desarrollo
-- Esto mejora el performance eliminando la evaluación de policies

-- Eliminar todas las policies existentes
DROP POLICY IF EXISTS "tenant_invites_select" ON public.tenant_invites;
DROP POLICY IF EXISTS "tenant_invites_insert" ON public.tenant_invites;
DROP POLICY IF EXISTS "tenant_invites_update" ON public.tenant_invites;

-- Deshabilitar RLS
ALTER TABLE public.tenant_invites DISABLE ROW LEVEL SECURITY;

-- Verificar estado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tenant_invites';
