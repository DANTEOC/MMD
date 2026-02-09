-- 1. Drop the old constraint FIRST so we can update values
ALTER TABLE public.tenant_work_orders 
DROP CONSTRAINT IF EXISTS tenant_work_orders_priority_check;

-- 2. Update 'critical' to 'urgent' (now allowed since constraint is gone)
UPDATE public.tenant_work_orders 
SET priority = 'urgent' 
WHERE priority = 'critical';

-- 3. Add the new constraint with 'urgent' included
ALTER TABLE public.tenant_work_orders
ADD CONSTRAINT tenant_work_orders_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
