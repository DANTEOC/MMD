-- Migración: Public Profiles + Sync + RLS (A-06.1)
-- Fecha: 2026-01-25

-- 1. Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger para sync desde Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    RETURN NEW;
END;
$$;

-- Trigger: se ejecuta después de insertar en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: Poblar perfiles para usuarios existentes
INSERT INTO public.profiles (id, email, full_name)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. RLS: Seguridad Same-Tenant
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Ver perfiles que comparten tenant activo
DROP POLICY IF EXISTS "View profiles from same tenant" ON public.profiles;
CREATE POLICY "View profiles from same tenant" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.tenant_users me
            JOIN public.tenant_users other ON me.tenant_id = other.tenant_id
            WHERE me.user_id = auth.uid() 
            AND other.user_id = profiles.id
            AND me.is_active = true
            AND other.is_active = true
        ) 
        OR auth.uid() = id -- Siempre ver mi propio perfil
    );

-- Policy: Editar solo mi propio perfil
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
CREATE POLICY "Update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Foreign Keys en Work Orders para facilitar Joins
-- Esto permite hacer select('*, assignee:profiles!assigned_to(*)')
DO $$
BEGIN
    -- FK for assigned_to -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_wo_assigned_to_profile'
    ) THEN
        ALTER TABLE public.tenant_work_orders 
        ADD CONSTRAINT fk_wo_assigned_to_profile 
        FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
    END IF;

    -- FK for created_by -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_wo_created_by_profile'
    ) THEN
        ALTER TABLE public.tenant_work_orders 
        ADD CONSTRAINT fk_wo_created_by_profile 
        FOREIGN KEY (created_by) REFERENCES public.profiles(id);
    END IF;
END $$;

-- Recargar cache
NOTIFY pgrst, 'reload schema';
