-- TICKET-07: Fixes for payments and purchases RLS

-- 1. Create tenant_payments table if not exists
CREATE TABLE IF NOT EXISTS public.tenant_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES public.tenant_work_orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL, -- cash, transfer, card, etc.
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant_wo ON public.tenant_payments(tenant_id, work_order_id);

-- Enable RLS
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants see/manage their own payments
CREATE POLICY "Tenants can view their own payments" 
ON public.tenant_payments FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenants can insert their own payments" 
ON public.tenant_payments FOR INSERT 
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenants can update their own payments" 
ON public.tenant_payments FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- 2. Fix RLS for tenant_purchases (Allow Insert for Technicians/Operators)
-- Drop existing insert policy if it exists to avoid conflicts or just create a new one ensuring coverage
DROP POLICY IF EXISTS "Tenants can insert purchases" ON public.tenant_purchases;

CREATE POLICY "Tenants can insert purchases" 
ON public.tenant_purchases FOR INSERT 
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

-- Ensure Select policy covers tech/operators (existing policy might be restrictive)
-- Assuming "Tenants can view their own purchases" exists, but let's reinforce just in case
DROP POLICY IF EXISTS "Tenants can view purchases" ON public.tenant_purchases;
CREATE POLICY "Tenants can view purchases" 
ON public.tenant_purchases FOR SELECT 
USING (tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));
