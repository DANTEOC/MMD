-- Migration: Add 'quote' status to tenant_work_orders
-- Description: Updates the check constraint to allow 'quote' status.

DO $$
BEGIN
    -- 1. Drop existing constraint
    ALTER TABLE public.tenant_work_orders DROP CONSTRAINT IF EXISTS "tenant_work_orders_status_check";

    -- 2. Re-create constraint with 'quote' added
    ALTER TABLE public.tenant_work_orders 
    ADD CONSTRAINT "tenant_work_orders_status_check" 
    CHECK (status IN ('quote', 'pending', 'in_progress', 'completed', 'cancelled'));

    -- 3. Notify Schema Reload
    NOTIFY pgrst, 'reload schema';
END $$;
