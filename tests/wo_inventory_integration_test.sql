-- SQL Verification Script for Work Order Inventory Integration
-- Run this in Supabase SQL Editor

DO $test$
DECLARE
    v_tenant_id UUID;
    v_admin_id UUID;
    v_wo_id UUID;
    v_item_id UUID;
    v_loc_id UUID;
    v_move_id UUID;
    v_line_id UUID;
    v_stock_before NUMERIC;
    v_stock_after NUMERIC;
    v_result JSONB;
BEGIN
    -- 0. Context
    SELECT tenant_id, user_id INTO v_tenant_id, v_admin_id
    FROM public.tenant_users
    WHERE role_key = 'Admin' AND is_active = true
    LIMIT 1;

    IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'No Admin found'; END IF;
    PERFORM set_config('request.jwt.claim.sub', v_admin_id::text, true);

    -- 1. Setup Data
    -- Create Test WO
    INSERT INTO public.tenant_work_orders (tenant_id, title, description, status, priority, created_by)
    VALUES (v_tenant_id, 'Integration Test WO', 'Testing Inventory Link', 'pending', 'low', v_admin_id)
    RETURNING id INTO v_wo_id;
    
    -- Pick an Item and Location (created in previous test or create new)
    -- Ensure we have a product
    SELECT id INTO v_item_id FROM public.tenant_catalog_items 
    WHERE tenant_id = v_tenant_id AND kind = 'PRODUCT' AND is_stockable = true LIMIT 1;
    
    IF v_item_id IS NULL THEN
         INSERT INTO public.tenant_catalog_items (tenant_id, kind, name, sku, unit, is_stockable)
         VALUES (v_tenant_id, 'PRODUCT', 'Integration Filter', 'INT-001', 'unit', true)
         RETURNING id INTO v_item_id;
    END IF;

    -- Ensure Location
    SELECT id INTO v_loc_id FROM public.tenant_inventory_locations 
    WHERE tenant_id = v_tenant_id AND type = 'WAREHOUSE' LIMIT 1;

    IF v_loc_id IS NULL THEN
        INSERT INTO public.tenant_inventory_locations (tenant_id, name, type)
        VALUES (v_tenant_id, 'Integration Warehouse', 'WAREHOUSE')
        RETURNING id INTO v_loc_id;
    END IF;

    -- Add Stock (via RPC In)
    PERFORM public.api_inventory_in(v_item_id, v_loc_id, 50, 10.00, 'Test Setup');

    SELECT quantity INTO v_stock_before FROM public.tenant_inventory_stock 
    WHERE item_id = v_item_id AND location_id = v_loc_id;

    RAISE NOTICE 'Stock Before: %', v_stock_before;

    -- 2. Simulate "Server Action" Orchestration
    
    -- Step A: Inventory OUT
    SELECT (public.api_inventory_out(v_item_id, v_loc_id, 2, 'WO Usage Test'))->>'movement_id' 
    INTO v_move_id;
    
    RAISE NOTICE 'Movement Generated: %', v_move_id;
    
    IF v_move_id IS NULL THEN RAISE EXCEPTION 'Movement creation failed'; END IF;

    -- Step B: Work Order Line Creation (linked to movement)
    -- Using the NEW RPC v2
    SELECT line_id INTO v_line_id FROM public.api_work_order_add_line_v2(
        p_work_order_id := v_wo_id,
        p_kind := 'MATERIAL',
        p_name := 'Filter Replacement',
        p_qty := 2,
        p_unit := 'unit',
        p_unit_price := 20.00, -- Sale price
        p_cost_unit := 10.00,  -- Cost frozen from stock
        p_inventory_movement_id := v_move_id::UUID
    );

    RAISE NOTICE 'Line Created: %', v_line_id;

    -- 3. Verify Linkage
    PERFORM 1 FROM public.tenant_work_order_lines 
    WHERE id = v_line_id AND inventory_movement_id = v_move_id::UUID;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Linkage failed: Line does not point to movement'; END IF;

    -- 4. Verify Stock Deduction
    SELECT quantity INTO v_stock_after FROM public.tenant_inventory_stock 
    WHERE item_id = v_item_id AND location_id = v_loc_id;
    
    RAISE NOTICE 'Stock After: %', v_stock_after;

    IF v_stock_after <> (v_stock_before - 2) THEN
        RAISE EXCEPTION 'Stock deduction mismatch';
    END IF;

    RAISE NOTICE 'SUCCESS: Integration Verify Complete.';
    
    -- Cleanup (Optional)
    -- DELETE FROM public.tenant_work_orders WHERE id = v_wo_id;
    -- DELETE FROM public.tenant_catalog_items WHERE id = v_item_id; -- Cascade deletes stock/movements/lines
END;
$test$;
