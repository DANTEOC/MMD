-- Migration: Finance Module Updates (Ticket-03)
-- Description: Enhances existing Providers and Purchases tables for full Finance flow.

DO $$
BEGIN

-- 1. UPDATE PROVIDERS TABLE
-- Add missing structured columns
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_providers' AND column_name = 'email') THEN
    ALTER TABLE public.tenant_providers ADD COLUMN email TEXT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_providers' AND column_name = 'phone') THEN
    ALTER TABLE public.tenant_providers ADD COLUMN phone TEXT;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_providers' AND column_name = 'payment_terms') THEN
    ALTER TABLE public.tenant_providers ADD COLUMN payment_terms TEXT; -- e.g. "Net 30"
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_providers' AND column_name = 'contact_name') THEN
    ALTER TABLE public.tenant_providers ADD COLUMN contact_name TEXT;
END IF;


-- 2. UPDATE PURCHASES TABLE
-- Add missing Finance columns
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_purchases' AND column_name = 'purchase_date') THEN
    ALTER TABLE public.tenant_purchases ADD COLUMN purchase_date DATE DEFAULT CURRENT_DATE;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_purchases' AND column_name = 'due_date') THEN
    ALTER TABLE public.tenant_purchases ADD COLUMN due_date DATE;
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_purchases' AND column_name = 'currency') THEN
    ALTER TABLE public.tenant_purchases ADD COLUMN currency TEXT DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'EUR'));
END IF;

IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_purchases' AND column_name = 'reference') THEN
    ALTER TABLE public.tenant_purchases ADD COLUMN reference TEXT;
END IF;

-- Unified Amount Column (for simple expenses not using the items sub-table)
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenant_purchases' AND column_name = 'total_amount') THEN
    ALTER TABLE public.tenant_purchases ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0;
END IF;

-- Make location_id optional if it was required (it is FK, usually nullable, but let's ensure)
ALTER TABLE public.tenant_purchases ALTER COLUMN location_id DROP NOT NULL;

-- 3. INDEXES
-- Safe to create if not exists
CREATE INDEX IF NOT EXISTS idx_providers_email ON public.tenant_providers(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_purchases_due_date ON public.tenant_purchases(tenant_id, due_date);

-- 4. MIGRATE DATA (Optional)
-- If we had old data, we might want to fill purchase_date from created_at
UPDATE public.tenant_purchases 
SET purchase_date = created_at::date 
WHERE purchase_date IS NULL;

END $$;
