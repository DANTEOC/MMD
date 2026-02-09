-- Migración: Módulo Work Orders (A-06)
-- Fecha: 2026-01-25

CREATE TABLE IF NOT EXISTS public.tenant_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_wo_tenant_status ON public.tenant_work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_wo_assigned_to ON public.tenant_work_orders(assigned_to);

-- RLS
ALTER TABLE public.tenant_work_orders ENABLE ROW LEVEL SECURITY;

-- SELECT: Todo miembro activo del tenant puede ver
CREATE POLICY "Tenant members can view WO" ON public.tenant_work_orders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_work_orders.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
        )
    );

-- INSERT: Operador, Tecnico, Admin
CREATE POLICY "Staff can create WO" ON public.tenant_work_orders
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_work_orders.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key IN ('Admin', 'Operador', 'Tecnico')
        )
    );

-- UPDATE: Operador, Tecnico, Admin
CREATE POLICY "Staff can update WO" ON public.tenant_work_orders
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_work_orders.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key IN ('Admin', 'Operador', 'Tecnico')
        )
    );

-- DELETE: Solo Admin (Opcional, por ahora permitimos a Admin borrar)
CREATE POLICY "Admins can delete WO" ON public.tenant_work_orders
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_work_orders.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key = 'Admin'
        )
    );
