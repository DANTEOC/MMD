-- Migration: Create Banks Table (Ticket-02)

-- 1. Create tenant_bank_accounts table
CREATE TABLE IF NOT EXISTS public.tenant_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,           -- e.g. "BBVA Principal"
    bank_name TEXT NOT NULL,      -- e.g. "BBVA", "Banamex"
    account_number TEXT NOT NULL, -- Last 4 digits or CLABE
    currency TEXT NOT NULL DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'EUR')),
    initial_balance NUMERIC(15,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.tenant_bank_accounts ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- SELECT: Admin, Supervisor, Contador, Operador
DROP POLICY IF EXISTS "Banks View" ON public.tenant_bank_accounts;
CREATE POLICY "Banks View" ON public.tenant_bank_accounts FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor', 'Contador', 'Operador') 
        AND is_active = true
    )
);

-- INSERT: Admin, Supervisor, Contador
DROP POLICY IF EXISTS "Banks Insert" ON public.tenant_bank_accounts;
CREATE POLICY "Banks Insert" ON public.tenant_bank_accounts FOR INSERT WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor', 'Contador') 
        AND is_active = true
    )
);

-- UPDATE: Admin, Supervisor, Contador
DROP POLICY IF EXISTS "Banks Update" ON public.tenant_bank_accounts;
CREATE POLICY "Banks Update" ON public.tenant_bank_accounts FOR UPDATE USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor', 'Contador') 
        AND is_active = true
    )
);

-- DELETE: Admin only
DROP POLICY IF EXISTS "Banks Delete" ON public.tenant_bank_accounts;
CREATE POLICY "Banks Delete" ON public.tenant_bank_accounts FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key = 'Admin' 
        AND is_active = true
    )
);

-- 4. Trigger for updated_at
CREATE TRIGGER set_updated_at_tenant_bank_accounts
    BEFORE UPDATE ON public.tenant_bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
