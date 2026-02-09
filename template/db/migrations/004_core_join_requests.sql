-- 004_core_join_requests.sql
-- TABLA: tenant_join_requests
-- Propósito: Manejo de solicitudes de acceso

CREATE TABLE public.tenant_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ,
    decided_by UUID REFERENCES auth.users(id),
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_join_requests_tenant_status ON public.tenant_join_requests(tenant_id, status);
CREATE INDEX idx_join_requests_user ON public.tenant_join_requests(user_id);

ALTER TABLE public.tenant_join_requests ENABLE ROW LEVEL SECURITY;

-- INSERT: Usuario autenticado solicita para sí mismo
CREATE POLICY "Users can create their own requests" ON public.tenant_join_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- SELECT: Usuario ve las suyas
CREATE POLICY "Users can view their own requests" ON public.tenant_join_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- SELECT: Admin ve las de su tenant
CREATE POLICY "Admins can view tenant requests" ON public.tenant_join_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = tenant_join_requests.tenant_id 
            AND tu.user_id = auth.uid() 
            AND tu.role_key IN ('Admin', 'Tecnico') 
            AND tu.is_active = true
        )
    );
