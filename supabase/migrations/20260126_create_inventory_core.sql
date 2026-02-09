-- Migration: Inventory Core (Catalog, Locations, Stock, Movements)
-- Description: Core tables for inventory management with RLS and RPCs

-- 1. CATALOG ITEMS (Productos y Servicios)
CREATE TABLE IF NOT EXISTS public.tenant_catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    kind TEXT NOT NULL CHECK (kind IN ('PRODUCT', 'SERVICE')),
    name TEXT NOT NULL,
    sku TEXT, -- Optional, mostly for products
    description TEXT,
    
    unit TEXT NOT NULL DEFAULT 'unit', -- pieza, litro, hora, etc.
    sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    base_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    
    is_stockable BOOLEAN NOT NULL DEFAULT false,
    min_stock NUMERIC(15, 2) DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_service_not_stockable CHECK (kind <> 'SERVICE' OR is_stockable = false)
);

CREATE INDEX IF NOT EXISTS idx_catalog_tenant_kind ON public.tenant_catalog_items(tenant_id, kind);
CREATE INDEX IF NOT EXISTS idx_catalog_sku ON public.tenant_catalog_items(tenant_id, sku) WHERE sku IS NOT NULL;

-- 2. INVENTORY LOCATIONS
CREATE TABLE IF NOT EXISTS public.tenant_inventory_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('WAREHOUSE', 'VEHICLE', 'EXTERNAL')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_tenant ON public.tenant_inventory_locations(tenant_id);

-- 3. INVENTORY STOCK
-- This table is managed AUTOMATICALLY by RPCs, not manually editable
CREATE TABLE IF NOT EXISTS public.tenant_inventory_stock (
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.tenant_inventory_locations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.tenant_catalog_items(id) ON DELETE CASCADE,
    
    quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (quantity >= 0), -- Prevent negative stock
    last_verified_at TIMESTAMPTZ,
    
    PRIMARY KEY (tenant_id, location_id, item_id)
);

-- 4. INVENTORY MOVEMENTS (Kardex)
-- Immutable log of all changes
CREATE TABLE IF NOT EXISTS public.tenant_inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER')),
    
    item_id UUID NOT NULL REFERENCES public.tenant_catalog_items(id),
    
    -- Locations can be null depending on movement type (e.g., IN might not have 'from')
    location_from_id UUID REFERENCES public.tenant_inventory_locations(id),
    location_to_id UUID REFERENCES public.tenant_inventory_locations(id),
    
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Cost at moment of movement
    
    reference TEXT, -- "PO-123", "WO-456", "Initial Load"
    
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    role_key_snapshot TEXT, -- Snapshot of user role at that time
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_tenant_item ON public.tenant_inventory_movements(tenant_id, item_id);
CREATE INDEX IF NOT EXISTS idx_movements_perform ON public.tenant_inventory_movements(tenant_id, created_at);


-- RLS POLICIES ----------------------------------------------------------------

ALTER TABLE public.tenant_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_inventory_movements ENABLE ROW LEVEL SECURITY;

-- Catalog: View ALL, Edit ADMIN/SUPERVISOR
CREATE POLICY "View Catalog" ON public.tenant_catalog_items FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Manage Catalog" ON public.tenant_catalog_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND tenant_id = tenant_catalog_items.tenant_id 
        AND role_key IN ('Admin', 'Supervisor')
        AND is_active = true
    )
);

-- Locations: View ALL, Edit ADMIN/SUPERVISOR
CREATE POLICY "View Locations" ON public.tenant_inventory_locations FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Manage Locations" ON public.tenant_inventory_locations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.tenant_users 
        WHERE user_id = auth.uid() 
        AND tenant_id = tenant_inventory_locations.tenant_id 
        AND role_key IN ('Admin', 'Supervisor')
        AND is_active = true
    )
);

-- Stock: View ALL, Manual Edit DENIED (Only via RPC)
CREATE POLICY "View Stock" ON public.tenant_inventory_stock FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND is_active = true)
);
-- No insert/update/delete policies for Stock = Denied by default.

-- Movements: View ALL, Insert via RPC only (RPC is Security Definer or checks logically)
-- But we can allow INSERT if we trust the server action user check + constraints.
-- However, strict requirements say update stock automatically.
-- So we DENY direct insert to movements to force usage of RPCs which maintain consistency.
CREATE POLICY "View Movements" ON public.tenant_inventory_movements FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid() AND is_active = true)
);


-- RPCs (Transactional Inventory Operations) -----------------------------------

-- 1. INVENTORY IN (Entrada / Compra / Ajuste Positivo)
CREATE OR REPLACE FUNCTION api_inventory_in(
    p_item_id UUID,
    p_location_to_id UUID,
    p_quantity NUMERIC,
    p_unit_cost NUMERIC,
    p_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as owner to bypass RLS on stock table update
AS $$
DECLARE
    v_tenant_id UUID;
    v_user_role TEXT;
    v_item_is_stockable BOOLEAN;
    v_new_movement_id UUID;
BEGIN
    -- 1. Get Tenant and Role
    SELECT tenant_id, role_key INTO v_tenant_id, v_user_role
    FROM public.tenant_users
    WHERE user_id = auth.uid() AND is_active = true;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 2. Permission Check (Admin/Supervisor)
    IF v_user_role NOT IN ('Admin', 'Supervisor') THEN
        RAISE EXCEPTION 'Insufficient permissions for Inventory IN';
    END IF;

    -- 3. Validation
    IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

    SELECT is_stockable INTO v_item_is_stockable
    FROM public.tenant_catalog_items
    WHERE id = p_item_id AND tenant_id = v_tenant_id;

    IF v_item_is_stockable IS FALSE THEN
        RAISE EXCEPTION 'Item is not stockable';
    END IF;

    -- 4. Create Movement
    INSERT INTO public.tenant_inventory_movements (
        tenant_id, movement_type, item_id, location_to_id, 
        quantity, unit_cost, reference, performed_by, role_key_snapshot
    ) VALUES (
        v_tenant_id, 'IN', p_item_id, p_location_to_id,
        p_quantity, p_unit_cost, p_reference, auth.uid(), v_user_role
    ) RETURNING id INTO v_new_movement_id;

    -- 5. Update Stock (Upsert)
    INSERT INTO public.tenant_inventory_stock (tenant_id, location_id, item_id, quantity, last_verified_at)
    VALUES (v_tenant_id, p_location_to_id, p_item_id, p_quantity, NOW())
    ON CONFLICT (tenant_id, location_id, item_id)
    DO UPDATE SET 
        quantity = public.tenant_inventory_stock.quantity + p_quantity,
        last_verified_at = NOW();

    RETURN jsonb_build_object('success', true, 'movement_id', v_new_movement_id);
END;
$$;


-- 2. INVENTORY OUT (Salida / Consumo / Ajuste Negativo)
CREATE OR REPLACE FUNCTION api_inventory_out(
    p_item_id UUID,
    p_location_from_id UUID,
    p_quantity NUMERIC,
    p_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_user_role TEXT;
    v_current_stock NUMERIC;
    v_new_movement_id UUID;
BEGIN
    -- 1. Get Tenant and Role
    SELECT tenant_id, role_key INTO v_tenant_id, v_user_role
    FROM public.tenant_users
    WHERE user_id = auth.uid() AND is_active = true;

    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;

    -- 2. Permission Check (Admin/Supervisor/Tecnico)
    IF v_user_role NOT IN ('Admin', 'Supervisor', 'Tecnico') THEN
        RAISE EXCEPTION 'Insufficient permissions for Inventory OUT';
    END IF;

    IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

    -- 3. Check Stock
    SELECT quantity INTO v_current_stock
    FROM public.tenant_inventory_stock
    WHERE tenant_id = v_tenant_id 
    AND location_id = p_location_from_id 
    AND item_id = p_item_id;

    IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %', COALESCE(v_current_stock, 0);
    END IF;

    -- 4. Create Movement
    INSERT INTO public.tenant_inventory_movements (
        tenant_id, movement_type, item_id, location_from_id, 
        quantity, unit_cost, reference, performed_by, role_key_snapshot
    ) VALUES (
        v_tenant_id, 'OUT', p_item_id, p_location_from_id,
        p_quantity, 0, p_reference, auth.uid(), v_user_role
    ) RETURNING id INTO v_new_movement_id;

    -- 5. Update Stock
    UPDATE public.tenant_inventory_stock
    SET quantity = quantity - p_quantity
    WHERE tenant_id = v_tenant_id 
    AND location_id = p_location_from_id 
    AND item_id = p_item_id;

    RETURN jsonb_build_object('success', true, 'movement_id', v_new_movement_id);
END;
$$;


-- 3. INVENTORY TRANSFER (Movimiento entre ubicaciones)
CREATE OR REPLACE FUNCTION api_inventory_transfer(
    p_item_id UUID,
    p_location_from_id UUID,
    p_location_to_id UUID,
    p_quantity NUMERIC,
    p_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_user_role TEXT;
    v_current_stock NUMERIC;
    v_new_movement_id UUID;
BEGIN
    -- 1. Get Tenant & Permissions
    SELECT tenant_id, role_key INTO v_tenant_id, v_user_role
    FROM public.tenant_users
    WHERE user_id = auth.uid() AND is_active = true;

    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Access denied'; END IF;

    IF v_user_role NOT IN ('Admin', 'Supervisor') THEN
        RAISE EXCEPTION 'Insufficient permissions for Inventory TRANSFER';
    END IF;

    IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
    IF p_location_from_id = p_location_to_id THEN RAISE EXCEPTION 'Source and destination must be different'; END IF;

    -- 2. Check Source Stock
    SELECT quantity INTO v_current_stock
    FROM public.tenant_inventory_stock
    WHERE tenant_id = v_tenant_id 
    AND location_id = p_location_from_id 
    AND item_id = p_item_id;

    IF v_current_stock IS NULL OR v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock in source location';
    END IF;

    -- 3. Create Movement
    INSERT INTO public.tenant_inventory_movements (
        tenant_id, movement_type, item_id, location_from_id, location_to_id,
        quantity, unit_cost, reference, performed_by, role_key_snapshot
    ) VALUES (
        v_tenant_id, 'TRANSFER', p_item_id, p_location_from_id, p_location_to_id,
        p_quantity, 0, p_reference, auth.uid(), v_user_role
    ) RETURNING id INTO v_new_movement_id;

    -- 4. Update Source Stock
    UPDATE public.tenant_inventory_stock
    SET quantity = quantity - p_quantity
    WHERE tenant_id = v_tenant_id 
    AND location_id = p_location_from_id 
    AND item_id = p_item_id;

    -- 5. Update Destination Stock
    INSERT INTO public.tenant_inventory_stock (tenant_id, location_id, item_id, quantity, last_verified_at)
    VALUES (v_tenant_id, p_location_to_id, p_item_id, p_quantity, NOW())
    ON CONFLICT (tenant_id, location_id, item_id)
    DO UPDATE SET 
        quantity = public.tenant_inventory_stock.quantity + p_quantity;

    RETURN jsonb_build_object('success', true, 'movement_id', v_new_movement_id);
END;
$$;
