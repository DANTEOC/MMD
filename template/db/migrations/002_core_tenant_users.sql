-- 002_core_tenant_users.sql
-- TABLA: tenant_users
-- Propósito: Relación N:M entre usuarios (Auth) y tenants.
-- Modelo: "1 Tenant Activo por Usuario" (Modelo B)

CREATE TABLE public.tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_key TEXT NOT NULL DEFAULT 'Lectura' CHECK (role_key IN ('Admin', 'Operador', 'Tecnico', 'Lectura')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Restricción básica: par único user-tenant
    UNIQUE(tenant_id, user_id)
);

-- Índice Parcial para ENFORCE 1 solo active=true por usuario
CREATE UNIQUE INDEX idx_one_active_tenant_per_user 
ON public.tenant_users(user_id) 
WHERE (is_active = true);

-- Índices de búsqueda
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);

-- Comentarios
COMMENT ON TABLE public.tenant_users IS 'Core: Membresías de usuarios en tenants';
