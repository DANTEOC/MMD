-- Migration: Add Tenant Settings fields (Ticket 12)
-- Description: Adds Logo, RFC, Address, Contact, and Terms fields to tenants table.

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT, -- RFC in Mexico
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_zip TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- Limit access to update these fields strictly to Admins (handled via RLS/Policies usually, but ensuring policy exists)
-- Assuming existing policy "Enable update for users based on tenant_users" exists or we rely on Server Actions checking roles.
