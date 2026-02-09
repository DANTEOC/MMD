-- Migración: Fix Work Orders (Client ID Nullable)
-- Fecha: 2026-01-25
-- Descripción: El campo client_id existe y es NOT NULL, pero no está implementado en la v1. Lo hacemos nullable.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_work_orders' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE public.tenant_work_orders ALTER COLUMN client_id DROP NOT NULL;
    END IF;

    -- Recargar Cache de Schema
    NOTIFY pgrst, 'reload schema';
END $$;
