-- Migration: Create Service Types Catalog
-- Description: Adds tenant_service_types table and links it to tenant_work_orders

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.tenant_service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate names (case insensitive) within a tenant
    CONSTRAINT tenant_service_types_name_key UNIQUE (tenant_id, name)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_service_types_tenant_active 
ON public.tenant_service_types(tenant_id, is_active);

-- 2. RLS
ALTER TABLE public.tenant_service_types ENABLE ROW LEVEL SECURITY;

-- SELECT: All tenant members can view
CREATE POLICY "Tenant members can view service types" ON public.tenant_service_types
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_service_types.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
        )
    );

-- MODIFY: Only Admin/Operador
CREATE POLICY "Admin/Operador can manage service types" ON public.tenant_service_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_users 
            WHERE tenant_users.tenant_id = tenant_service_types.tenant_id 
            AND tenant_users.user_id = auth.uid()
            AND tenant_users.is_active = true
            AND tenant_users.role_key IN ('Admin', 'Operador')
        )
    );

-- 3. Link to Work Orders
ALTER TABLE public.tenant_work_orders
ADD COLUMN IF NOT EXISTS service_type_id UUID REFERENCES public.tenant_service_types(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_wo_service_type 
ON public.tenant_work_orders(tenant_id, service_type_id);
