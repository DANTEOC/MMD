-- 001_core_tenants.sql
-- TABLA: tenants
-- Propósito: Almacenar las organizaciones/tenants del sistema.

CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- Slug único para URLs y búsquedas
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tenants_slug_key UNIQUE (slug)
);

-- Índices
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- Comentarios
COMMENT ON TABLE public.tenants IS 'Core: Tabla de organizaciones/tenants';
