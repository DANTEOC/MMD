-- ============================================================================
-- MIGRACIÓN U-02: Tablas base multi-tenant
-- ============================================================================
-- Objetivo: Crear estructura mínima para multi-tenancy
-- - tenants: tabla de organizaciones/empresas
-- - tenant_users: vínculo entre auth.users y tenants con roles
-- 
-- IMPORTANTE: Esta migración NO incluye RLS policies (ver U-03)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla TENANTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsquedas por slug
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Índice para filtrar activos
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON public.tenants(is_active);

COMMENT ON TABLE public.tenants IS 'Organizaciones/empresas en el sistema multi-tenant';
COMMENT ON COLUMN public.tenants.slug IS 'Identificador único amigable para URLs';
COMMENT ON COLUMN public.tenants.is_active IS 'Indica si el tenant está activo (soft delete)';

-- ----------------------------------------------------------------------------
-- 2. Tabla TENANT_USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_key TEXT NOT NULL CHECK (role_key IN ('Admin', 'Operador', 'Tecnico', 'Lectura')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraint: un usuario solo puede tener UN rol por tenant
    CONSTRAINT unique_user_per_tenant UNIQUE (tenant_id, user_id)
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role_key ON public.tenant_users(role_key);
CREATE INDEX IF NOT EXISTS idx_tenant_users_is_active ON public.tenant_users(is_active);

-- Índice compuesto para búsquedas de usuario activo en tenant
CREATE INDEX IF NOT EXISTS idx_tenant_users_active_lookup 
    ON public.tenant_users(user_id, tenant_id) 
    WHERE is_active = true;

COMMENT ON TABLE public.tenant_users IS 'Vínculo entre usuarios (auth.users) y tenants con asignación de roles';
COMMENT ON COLUMN public.tenant_users.role_key IS 'Rol del usuario: Admin, Operador, Tecnico, Lectura';
COMMENT ON COLUMN public.tenant_users.is_active IS 'Indica si la membresía está activa (soft delete)';
COMMENT ON CONSTRAINT unique_user_per_tenant ON public.tenant_users IS 'Un usuario solo puede tener un rol por tenant';

-- ----------------------------------------------------------------------------
-- 3. Trigger para updated_at automático
-- ----------------------------------------------------------------------------

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tenants
DROP TRIGGER IF EXISTS set_updated_at_tenants ON public.tenants;
CREATE TRIGGER set_updated_at_tenants
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para tenant_users
DROP TRIGGER IF EXISTS set_updated_at_tenant_users ON public.tenant_users;
CREATE TRIGGER set_updated_at_tenant_users
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FIN MIGRACIÓN U-02
-- ============================================================================
