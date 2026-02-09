-- Migration: Add Tax fields to Purchases (A-08.1)
-- Description: Adds subtotal, tax_rate, and tax fields to tenant_purchases to handle VAT and other taxes.

ALTER TABLE public.tenant_purchases
ADD COLUMN IF NOT EXISTS subtotal_estimated NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate_estimated NUMERIC(5,4) DEFAULT 0.1600, -- Default 16%
ADD COLUMN IF NOT EXISTS tax_estimated NUMERIC(15,2) DEFAULT 0;

ALTER TABLE public.tenant_purchases
ADD COLUMN IF NOT EXISTS subtotal_real NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate_real NUMERIC(5,4) DEFAULT 0.1600,
ADD COLUMN IF NOT EXISTS tax_real NUMERIC(15,2) DEFAULT 0;

-- Constraint check for non-negative values
ALTER TABLE public.tenant_purchases
ADD CONSTRAINT check_estimated_values CHECK (subtotal_estimated >= 0 AND tax_estimated >= 0 AND tax_rate_estimated >= 0),
ADD CONSTRAINT check_real_values CHECK (subtotal_real >= 0 AND tax_real >= 0 AND tax_rate_real >= 0);

-- Note: We trust the application logic to ensure total = subtotal + tax, 
-- but we could add a generated column if Postgres version supports it well or a trigger.
-- For now, application-side logic is flexible enough as requested.
