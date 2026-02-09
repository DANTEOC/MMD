-- Migration: Create Purchases Module (UI-04)
-- Description: Providers and Purchases with operational focus.

-- 1. PROVIDERS
CREATE TABLE IF NOT EXISTS public.tenant_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tax_id TEXT, -- Optional, operational reference
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_tenant ON public.tenant_providers(tenant_id);

-- 2. PURCHASES
CREATE TABLE IF NOT EXISTS public.tenant_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    provider_id UUID REFERENCES public.tenant_providers(id) ON DELETE SET NULL, -- Keep history if provider deleted
    location_id UUID REFERENCES public.tenant_inventory_locations(id) ON DELETE RESTRICT, -- Must exist
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    
    -- Cache totals
    total_estimated NUMERIC(15,2) DEFAULT 0,
    total_real NUMERIC(15,2) DEFAULT 0,
    
    notes TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_tenant_status ON public.tenant_purchases(tenant_id, status);

-- 3. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS public.tenant_purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES public.tenant_purchases(id) ON DELETE CASCADE,
    
    item_id UUID NOT NULL REFERENCES public.tenant_catalog_items(id),
    
    quantity_ordered NUMERIC(15,4) NOT NULL DEFAULT 1 CHECK (quantity_ordered > 0),
    unit_cost_estimated NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Filled at reception
    quantity_received NUMERIC(15,4) DEFAULT 0 CHECK (quantity_received >= 0),
    unit_cost_real NUMERIC(15,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON public.tenant_purchase_items(purchase_id);

-- 4. RLS POLICIES
ALTER TABLE public.tenant_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_purchase_items ENABLE ROW LEVEL SECURITY;

-- Helper policy for "Management" (Admin/Supervisor) vs "Read" (Everyone except maybe roles implicitly restricted, assuming 'Lectura' is a role key)
-- Roles: Admin, Supervisor, Tecnico, Lectura.
-- Tecnico: NO ACCESS.
-- Lectura: View Only.
-- Admin/Supervisor: Manage.

-- PROVIDERS
CREATE POLICY "Providers View: Admin, Supervisor, Lectura" ON public.tenant_providers FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor', 'Lectura')
        AND is_active = true
    )
);

CREATE POLICY "Providers Manage: Admin, Supervisor" ON public.tenant_providers FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor')
        AND is_active = true
    )
);

-- PURCHASES
CREATE POLICY "Purchases View: Admin, Supervisor, Lectura" ON public.tenant_purchases FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor', 'Lectura')
        AND is_active = true
    )
);

CREATE POLICY "Purchases Manage: Admin, Supervisor" ON public.tenant_purchases FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND role_key IN ('Admin', 'Supervisor')
        AND is_active = true
    )
);

-- ITEMS
CREATE POLICY "Purchase Items View: Admin, Supervisor, Lectura" ON public.tenant_purchase_items FOR SELECT USING (
    purchase_id IN (
        SELECT id FROM public.tenant_purchases 
        WHERE tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role_key IN ('Admin', 'Supervisor', 'Lectura')
            AND is_active = true
        )
    )
);

CREATE POLICY "Purchase Items Manage: Admin, Supervisor" ON public.tenant_purchase_items FOR ALL USING (
    purchase_id IN (
        SELECT id FROM public.tenant_purchases 
        WHERE tenant_id IN (
            SELECT tenant_id FROM public.tenant_users 
            WHERE user_id = auth.uid() 
            AND role_key IN ('Admin', 'Supervisor')
            AND is_active = true
        )
    )
);
