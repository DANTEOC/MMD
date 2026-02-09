-- 010_module_clients_example.sql
-- TABLA: tenant_clients (Ejemplo)
-- Propósito: Demostrar patrón de tabla perteneciente a un tenant.

CREATE TABLE public.tenant_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_tenant ON public.tenant_clients(tenant_id);

ALTER TABLE public.tenant_clients ENABLE ROW LEVEL SECURITY;

-- POLICIES (Patrón Estándar Core)

-- SELECT: Miembros del tenant pueden ver
CREATE POLICY "Tenant members can view clients" ON public.tenant_clients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_clients.tenant_id 
            AND tenant_users.user_id = auth.uid()
        )
    );

-- INSERT: Miembros con rol >= Operador pueden crear
CREATE POLICY "Operators+ can create clients" ON public.tenant_clients
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_clients.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.role_key IN ('Admin', 'Operador', 'Tecnico')
        )
    );

-- UPDATE/DELETE: Similar a INSERT...
