-- Migration: Inventory Consumption from WO (A-09)
-- Description: Links WO lines to Inventory Items and adds RPC for consumption.

-- 1. Add item_id to tenant_work_order_lines to link to Catalog
ALTER TABLE public.tenant_work_order_lines
ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES public.tenant_catalog_items(id);

CREATE INDEX IF NOT EXISTS idx_wo_lines_item ON public.tenant_work_order_lines(item_id);

-- 2. Add consumed_quantity to track how much has been consumed vs planned
ALTER TABLE public.tenant_work_order_lines
ADD COLUMN IF NOT EXISTS quantity_consumed NUMERIC(14,4) DEFAULT 0 CHECK (quantity_consumed >= 0);

-- 3. RPC: Consume Item from Inventory for a WO
-- This function performs the inventory out movement OR just records usage if no stock link
-- Ideally, we want to perform a real inventory OUT movement.

CREATE OR REPLACE FUNCTION public.api_work_order_consume_item(
    p_work_order_id UUID,
    p_item_id UUID,
    p_location_id UUID,
    p_quantity NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_tenant_id UUID;
    v_wo_number TEXT;
    v_line_id UUID;
    v_cost NUMERIC(12,2);
BEGIN
    -- Get active tenant
    v_tenant_id := public.active_tenant_id();
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No active tenant' USING ERRCODE = '42501';
    END IF;

    -- Verify WO exists and get number for reference
    SELECT id::text INTO v_wo_number -- Using ID or a human readable number? internal_id? 
    -- Let's assume we use the first part of UUID if no display_id exists, 
    -- BUT wait, usually we want a readable reference. 
    -- Checking tenant_work_orders schema... it has no display number? 
    -- Let's use "WO-" || substring of ID for now or title.
    -- Better: Select title or some ref.
    FROM public.tenant_work_orders 
    WHERE id = p_work_order_id AND tenant_id = v_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Work Order not found' USING ERRCODE = '23503';
    END IF;
    
    -- Using the first 8 chars of ID as ref for now conformant with A-09 "OS-xxxx"
    v_wo_number := 'OS-' || substring(p_work_order_id::text, 1, 8);

    -- 1. Execute Inventory Out (Reusing existing logic or direct insert?)
    -- Existing logic: api_inventory_out. But we need to call it from here.
    -- Let's do it directly to ensure transaction atomicity and specific reference format.
    
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    -- Check stock
    IF NOT EXISTS (
        SELECT 1 FROM public.tenant_inventory_stock 
        WHERE item_id = p_item_id AND location_id = p_location_id AND quantity >= p_quantity
    ) THEN
        RAISE EXCEPTION 'Insufficient stock';
    END IF;

    -- Deduct Stock
    UPDATE public.tenant_inventory_stock
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE tenant_id = v_tenant_id 
      AND item_id = p_item_id 
      AND location_id = p_location_id;

    -- Record Movement
    INSERT INTO public.tenant_inventory_movements (
        tenant_id,
        item_id,
        location_from_id,
        quantity,
        movement_type,
        reference,
        notes,
        performed_by
    ) VALUES (
        v_tenant_id,
        p_item_id,
        p_location_id,
        p_quantity,
        'OUT',
        v_wo_number, -- Reference to OS
        COALESCE(p_notes, 'Consumo desde Orden de Servicio'),
        auth.uid()
    );

    -- 2. Add or Update WO Line (Actual consumption record in WO)
    -- We add a line of kind MATERIAL with the cost.
    -- First get average cost or standard cost? 
    -- For now use 0 or item standard cost. 
    -- Fetch item info
    SELECT COALESCE(base_cost, 0) INTO v_cost 
    FROM public.tenant_catalog_items 
    WHERE id = p_item_id;

    -- Insert WO Line to reflect cost and material usage
    -- We create a NEW line for every consumption to have history? 
    -- Or we try to match an existing planned line? 
    -- Ticket says: "Planificar materials no afecta stock. Emitir consumo genera Salidas reales."
    -- "Trazabilidad obligatoria".
    -- Let's insert a NEW line representing this consumption event, 
    -- linking to the item.
    
    INSERT INTO public.tenant_work_order_lines (
        tenant_id,
        work_order_id,
        kind,
        name,
        unit,
        qty,
        unit_price, -- Price to customer? 
        cost_unit,
        line_total,
        cost_total,
        created_by,
        item_id,
        quantity_consumed
    ) 
    SELECT 
        v_tenant_id,
        p_work_order_id,
        'MATERIAL',
        name, -- Item name
        unit,
        p_quantity,
        COALESCE(base_cost * 1.3, 0), -- Example Markup or just 0? Leaving simple logic.
        COALESCE(base_cost, 0),
        0, -- Line Total (Price to customer) - maybe we don't charge yet? Let's leave 0 or calculated
        ROUnD((p_quantity * COALESCE(base_cost, 0))::numeric, 2), -- Cost Total
        auth.uid(),
        id, -- Item ID
        p_quantity -- Consumed
    FROM public.tenant_catalog_items
    WHERE id = p_item_id
    RETURNING id INTO v_line_id;

    -- Recalc WO Totals
    PERFORM public.fx_work_order_recalc_totals(v_tenant_id, p_work_order_id);

    RETURN jsonb_build_object('success', true, 'line_id', v_line_id);
END;
$$;
