-- Migration: Treasury & Collection (UI-05)
-- Description: Adds Payment tracking to Work Orders and Cash Flow tables.

DO $$
BEGIN

-- 1. MODIFY WORK ORDERS
-- Add columns if they don't exist
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_work_orders' AND column_name = 'payment_status') THEN
    ALTER TABLE public.tenant_work_orders 
    ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid'));
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_work_orders' AND column_name = 'amount_paid') THEN
    ALTER TABLE public.tenant_work_orders 
    ADD COLUMN amount_paid NUMERIC(15,2) DEFAULT 0;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_work_orders' AND column_name = 'total_amount') THEN
    ALTER TABLE public.tenant_work_orders 
    ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0;
END IF;

-- 2. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tenant_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES public.tenant_work_orders(id) ON DELETE CASCADE,
    
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL CHECK (method IN ('cash', 'transfer', 'card', 'check', 'other')),
    reference TEXT, -- e.g. Transaction ID
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Used as payment date
    
    -- Constraint: A payment belongs to same tenant as WO is implicit by FK, but good to enforce RLS
    CONSTRAINT positive_payment CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_wo ON public.tenant_payments(work_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.tenant_payments(created_at);

-- 3. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.tenant_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    concept TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT, -- Optional
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_expense CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.tenant_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON public.tenant_expenses(tenant_id);

-- 4. RLS POLICIES
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_expenses ENABLE ROW LEVEL SECURITY;

-- Payments: View (Admin/Sup/Lectura), Manage (Admin/Sup/Lectura for insert?)
-- Prompt: "Registrar Pago: Admin, Sup, Contador(Lectura)" => Lectura needs Insert? 
-- "Contador: lectura + registro". So yes.

-- Payments Policies
DROP POLICY IF EXISTS "Payments View" ON public.tenant_payments;
CREATE POLICY "Payments View" ON public.tenant_payments FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role_key IN ('Admin', 'Supervisor', 'Lectura') AND is_active = true)
);

DROP POLICY IF EXISTS "Payments Insert" ON public.tenant_payments;
CREATE POLICY "Payments Insert" ON public.tenant_payments FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role_key IN ('Admin', 'Supervisor', 'Lectura') AND is_active = true)
);
-- Update/Delete restricted usually to Admin or denied in operational logs. Allow Admin delete for correction?
DROP POLICY IF EXISTS "Payments Delete Admin" ON public.tenant_payments;
CREATE POLICY "Payments Delete Admin" ON public.tenant_payments FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role_key = 'Admin' AND is_active = true)
);


-- Expenses Policies
DROP POLICY IF EXISTS "Expenses View" ON public.tenant_expenses;
CREATE POLICY "Expenses View" ON public.tenant_expenses FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role_key IN ('Admin', 'Supervisor', 'Lectura') AND is_active = true)
);

DROP POLICY IF EXISTS "Expenses Manage" ON public.tenant_expenses;
CREATE POLICY "Expenses Manage" ON public.tenant_expenses FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND role_key IN ('Admin', 'Supervisor', 'Lectura') AND is_active = true)
);

END $$;

-- 5. FUNCTION & TRIGGER FOR WO TOTALS
CREATE OR REPLACE FUNCTION update_work_order_total() RETURNS TRIGGER AS $$
DECLARE
    v_wo_id UUID;
    v_total NUMERIC(15,2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_wo_id := OLD.work_order_id;
    ELSE
        v_wo_id := NEW.work_order_id;
    END IF;

    -- Calculate total from lines
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    INTO v_total
    FROM public.tenant_work_order_lines
    WHERE work_order_id = v_wo_id;

    -- Update WO
    UPDATE public.tenant_work_orders
    SET total_amount = v_total
    WHERE id = v_wo_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_wo_total ON public.tenant_work_order_lines;
CREATE TRIGGER trg_update_wo_total
AFTER INSERT OR UPDATE OR DELETE ON public.tenant_work_order_lines
FOR EACH ROW EXECUTE FUNCTION update_work_order_total();

-- Backfill totals for existing orders if needed (Optional, usually 0 if new DB, but handy)
UPDATE public.tenant_work_orders wo
SET total_amount = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM public.tenant_work_order_lines wol
    WHERE wol.work_order_id = wo.id
);

NOTIFY pgrst, 'reload schema';
