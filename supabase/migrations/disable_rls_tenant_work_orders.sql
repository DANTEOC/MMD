-- Deshabilitar RLS en tenant_work_orders para desarrollo
-- Esto mejora el performance eliminando la evaluación de policies

-- Eliminar todas las policies existentes
DROP POLICY IF EXISTS "tenant_work_orders_select" ON public.tenant_work_orders;
DROP POLICY IF EXISTS "tenant_work_orders_insert" ON public.tenant_work_orders;
DROP POLICY IF EXISTS "tenant_work_orders_update_admin_operator" ON public.tenant_work_orders;
DROP POLICY IF EXISTS "tenant_work_orders_update_assigned_tech" ON public.tenant_work_orders;
DROP POLICY IF EXISTS "tenant_work_orders_delete" ON public.tenant_work_orders;

-- Deshabilitar RLS
ALTER TABLE public.tenant_work_orders DISABLE ROW LEVEL SECURITY;

-- Verificar estado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tenant_work_orders';
