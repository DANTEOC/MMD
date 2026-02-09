-- Eliminar policies existentes de tenant_work_orders si existen
DROP POLICY IF EXISTS tenant_work_orders_select_own_tenant ON public.tenant_work_orders;
DROP POLICY IF EXISTS tenant_work_orders_insert_admin_operador ON public.tenant_work_orders;
DROP POLICY IF EXISTS tenant_work_orders_update_allowed ON public.tenant_work_orders;
DROP POLICY IF EXISTS tenant_work_orders_delete_admin ON public.tenant_work_orders;

-- Luego ejecutar el script completo 20260122_a06_tenant_work_orders.sql
