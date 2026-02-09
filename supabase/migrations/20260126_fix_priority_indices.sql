-- Migration: fix_priority_constraint_and_indices
-- Update values from 'critical' to 'urgent'
UPDATE public.tenant_work_orders 
SET priority = 'urgent' 
WHERE priority = 'critical';

-- Drop old constraint safely
DO $$
DECLARE 
    con_name text;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint 
    WHERE conrelid = 'public.tenant_work_orders'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%priority%';
    
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.tenant_work_orders DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

-- Add new constraint
ALTER TABLE public.tenant_work_orders
ADD CONSTRAINT tenant_work_orders_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add Indices for filtering
CREATE INDEX IF NOT EXISTS idx_wo_tenant_priority 
ON public.tenant_work_orders(tenant_id, priority);

CREATE INDEX IF NOT EXISTS idx_wo_tenant_status_priority 
ON public.tenant_work_orders(tenant_id, status, priority);

-- Optional: Index for Technician filtering
CREATE INDEX IF NOT EXISTS idx_wo_tenant_assigned_status 
ON public.tenant_work_orders(tenant_id, assigned_to, status);
