-- Add estimated_time column for Quotes/Work Orders
ALTER TABLE public.tenant_work_orders 
ADD COLUMN IF NOT EXISTS estimated_time TEXT;
