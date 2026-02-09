-- Migración: Fix Work Orders (Reset Constraints)
-- Fecha: 2026-01-25
-- Descripción: Elimina restricciones antiguas o mal nombradas y aplica las correctas.

DO $$
BEGIN
    -- 1. Intentar borrar constraint 'valid_status' si existe (parece ser el causante del error)
    BEGIN
        ALTER TABLE public.tenant_work_orders DROP CONSTRAINT IF EXISTS "valid_status";
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 2. Intentar borrar constraints por defecto (nombres comunes)
    BEGIN
        ALTER TABLE public.tenant_work_orders DROP CONSTRAINT IF EXISTS "tenant_work_orders_status_check";
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.tenant_work_orders DROP CONSTRAINT IF EXISTS "tenant_work_orders_priority_check";
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 3. Volver a aplicar constraints correctos
    
    -- Status
    ALTER TABLE public.tenant_work_orders 
    ADD CONSTRAINT "tenant_work_orders_status_check" 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

    -- Priority
    ALTER TABLE public.tenant_work_orders 
    ADD CONSTRAINT "tenant_work_orders_priority_check" 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

    -- Recargar schema
    NOTIFY pgrst, 'reload schema';
END $$;
