-- Add work_order_id to tenant_purchases to link expenses directly to orders
ALTER TABLE public.tenant_purchases 
ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES public.tenant_work_orders(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_purchases_work_order_id ON public.tenant_purchases(work_order_id);
