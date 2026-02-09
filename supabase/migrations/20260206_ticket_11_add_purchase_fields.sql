-- Migration: Add missing fields to Purchases (Ticket 11)
-- Description: Adds title, date, responsible, and payment method columns.

ALTER TABLE public.tenant_purchases
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS purchase_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.tenant_purchases(purchase_date);
