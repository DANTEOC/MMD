-- Migration: Inventory Adjustments and Returns (A-10)
-- Description: Adds subtypes for movements and RPCs for Target Adjustments and Returns.

-- 1. Add columns to tenant_inventory_movements
ALTER TABLE public.tenant_inventory_movements
ADD COLUMN IF NOT EXISTS subtype TEXT CHECK (subtype IN ('ADJUST', 'RETURN', 'REGULAR') OR subtype IS NULL), -- REGULAR or NULL for standard IN/OUT
ADD COLUMN IF NOT EXISTS reason_code TEXT,       -- PHYSICAL_COUNT, DAMAGE, ERROR_CORRECTION, OS_RETURN
ADD COLUMN IF NOT EXISTS reference_type TEXT,    -- OS, MANUAL, PURCHASE
ADD COLUMN IF NOT EXISTS reference_id UUID;      -- ID of the related object (WO, PO, etc)

CREATE INDEX IF NOT EXISTS idx_movements_subtype ON public.tenant_inventory_movements(tenant_id, subtype, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_ref ON public.tenant_inventory_movements(tenant_id, reference_type, reference_id);

-- 2. RPC: Adjust Stock to Target (Admin/Supervisor Only validation in logic or RLS, here focused on mechanics)
-- Calculates delta and inserts movement.
CREATE OR REPLACE FUNCTION public.api_inventory_adjust_target(
    p_item_id UUID,
    p_location_id UUID,
    p_target_qty NUMERIC,
    p_reason_code TEXT,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_current_qty NUMERIC;
    v_delta NUMERIC;
    v_movement_type TEXT;
    v_subtype TEXT := 'ADJUST';
BEGIN
    v_tenant_id := public.active_tenant_id();
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No active tenant'; END IF;

    -- Get current stock (lock row?)
    -- Insert if not exists handled by upsert usually, but here we assume record exists or is 0.
    -- We need to lock to avoid race conditions.
    
    -- Check if stock row exists
    SELECT quantity INTO v_current_qty
    FROM public.tenant_inventory_stock
    WHERE item_id = p_item_id AND location_id = p_location_id AND tenant_id = v_tenant_id
    FOR UPDATE; -- Lock

    IF NOT FOUND THEN
        v_current_qty := 0;
        -- Create row if target > 0, if target 0 and no row, do nothing? 
        -- Limit creation to actual movements.
        IF p_target_qty > 0 THEN
             INSERT INTO public.tenant_inventory_stock (tenant_id, item_id, location_id, quantity)
             VALUES (v_tenant_id, p_item_id, p_location_id, 0);
        END IF;
    END IF;

    v_delta := p_target_qty - v_current_qty;

    IF v_delta = 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'No change needed');
    END IF;

    IF v_delta > 0 THEN
        v_movement_type := 'IN';
    ELSE
        v_movement_type := 'OUT';
    END IF;

    -- Update Stock
    INSERT INTO public.tenant_inventory_stock (tenant_id, item_id, location_id, quantity)
    VALUES (v_tenant_id, p_item_id, p_location_id, p_target_qty)
    ON CONFLICT (tenant_id, item_id, location_id)
    DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();

    -- Record Movement
    INSERT INTO public.tenant_inventory_movements (
        tenant_id,
        item_id,
        location_from_id, -- For OUT? Logic: From=Loc implies Source. To=Loc implies Dest.
        location_to_id,   -- For IN?
        quantity,
        movement_type,
        subtype,
        reason_code,
        reference_type,
        notes,
        performed_by
    ) VALUES (
        v_tenant_id,
        p_item_id,
        CASE WHEN v_delta < 0 THEN p_location_id ELSE NULL END, -- Source if OUT
        CASE WHEN v_delta > 0 THEN p_location_id ELSE NULL END, -- Dest if IN
        ABS(v_delta),
        v_movement_type,
        v_subtype,
        p_reason_code,
        'MANUAL',
        p_notes,
        auth.uid()
    );

    RETURN jsonb_build_object('success', true, 'delta', v_delta);
END;
$$;

-- 3. RPC: Return to Stock (Returns increase stock)
CREATE OR REPLACE FUNCTION public.api_inventory_return(
    p_item_id UUID,
    p_location_id UUID,
    p_quantity NUMERIC,
    p_reason_code TEXT,
    p_reference_type TEXT, -- 'OS' or 'MANUAL'
    p_reference_id UUID,   -- WO ID
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_ref_text TEXT;
BEGIN
    v_tenant_id := public.active_tenant_id();
    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No active tenant'; END IF;

    IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;

    -- Calc Reference Text if OS
    IF p_reference_type = 'OS' AND p_reference_id IS NOT NULL THEN
       v_ref_text := 'OS-' || substring(p_reference_id::text, 1, 8) || ' (Return)';
    ELSE
       v_ref_text := 'Return ' || COALESCE(p_reference_type, 'Manual');
    END IF;

    -- Update Stock (Increase)
    INSERT INTO public.tenant_inventory_stock (tenant_id, item_id, location_id, quantity)
    VALUES (v_tenant_id, p_item_id, p_location_id, p_quantity)
    ON CONFLICT (tenant_id, item_id, location_id)
    DO UPDATE SET quantity = public.tenant_inventory_stock.quantity + p_quantity, updated_at = NOW();

    -- Record Movement
    INSERT INTO public.tenant_inventory_movements (
        tenant_id,
        item_id,
        location_to_id,
        quantity,
        movement_type,
        subtype,
        reason_code,
        reference_type,
        reference_id,
        reference,
        notes,
        performed_by
    ) VALUES (
        v_tenant_id,
        p_item_id,
        p_location_id,
        p_quantity,
        'IN',
        'RETURN',
        p_reason_code,
        p_reference_type,
        p_reference_id,
        v_ref_text,
        p_notes,
        auth.uid()
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
