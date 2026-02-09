-- Migración: Fix Work Orders (Force Columns)
-- Fecha: 2026-01-25
-- Descripción: Asegura que las columnas de usuario existan. Si la tabla se creó parcialmente, esto lo arregla.

DO $$
BEGIN
    -- Verificar y añadir created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_work_orders' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.tenant_work_orders ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Verificar y añadir priority
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_work_orders' AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.tenant_work_orders ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));
    END IF;

    -- Verificar y añadir assigned_to
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenant_work_orders' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE public.tenant_work_orders ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;
    
    -- Recargar Cache (Hack: Alterar tabla sin cambios funcionales fuerza refresh en PostgREST)
    NOTIFY pgrst, 'reload schema';
END $$;
