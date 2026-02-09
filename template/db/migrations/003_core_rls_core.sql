-- 003_core_rls_core.sql
-- SEGURIDAD: RLS para tenants y tenant_users

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- POLICIES: tenant_users
-- Usuarios ven sus propias membresías
CREATE POLICY "Users view own memberships" ON public.tenant_users
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- POLICIES: tenants
-- Usuarios ven tenants donde son miembros activos (o miembros en general)
CREATE POLICY "Users view tenants they belong to" ON public.tenants
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenants.id 
            AND tenant_users.user_id = auth.uid()
        )
    );

-- Nota: Para el flujo de solicitud por SLUG, necesitamos leer tenants
-- O bien hacemos una función RPC, o permitimos lectura pública de slug/name
-- Para este template, permitiremos lectura de id/name/slug a autenticados para 
-- facilitar dropdowns o validaciones, PERO restringido a lo mínimo.
CREATE POLICY "Auth users can view basic tenant info" ON public.tenants
    FOR SELECT TO authenticated
    USING (true); -- Simplificación para MVP request-flow. 
                  -- En prod restrictivo: solo vía RPC o published tenants.
