-- SQL Verification Script (Plain SQL Version)
-- Run these statements in the SQL Editor.
-- This approach avoids PL/pgSQL variable parsing issues.

-- 1. Mock Authentication (Simulate Admin)
SELECT set_config(
    'request.jwt.claim.sub', 
    (SELECT user_id::text FROM public.tenant_users WHERE role_key = 'Admin' AND is_active = true LIMIT 1), 
    true
);

-- 2. Cleanup previous test data (if any)
DELETE FROM public.tenant_inventory_movements WHERE reference IN ('Initial Stock', 'Restock Van', 'Job Consumption', 'Overdraft', 'Service Stock');
DELETE FROM public.tenant_inventory_stock WHERE item_id IN (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001' OR name = 'Test SQL Service');
DELETE FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001' OR name = 'Test SQL Service';
DELETE FROM public.tenant_inventory_locations WHERE name IN ('SQL Warehouse', 'SQL Van');

-- 3. Create Data (Using CTEs usually better, but separate inserts are safer for simple editors)
-- Items
INSERT INTO public.tenant_catalog_items (tenant_id, kind, name, sku, unit, is_stockable)
SELECT tenant_id, 'PRODUCT', 'Test SQL Filter', 'TEST-SQL-001', 'piece', true
FROM public.tenant_users WHERE role_key = 'Admin' LIMIT 1;

INSERT INTO public.tenant_catalog_items (tenant_id, kind, name, unit, is_stockable)
SELECT tenant_id, 'SERVICE', 'Test SQL Service', 'hour', false
FROM public.tenant_users WHERE role_key = 'Admin' LIMIT 1;

-- Locations
INSERT INTO public.tenant_inventory_locations (tenant_id, name, type)
SELECT tenant_id, 'SQL Warehouse', 'WAREHOUSE'
FROM public.tenant_users WHERE role_key = 'Admin' LIMIT 1;

INSERT INTO public.tenant_inventory_locations (tenant_id, name, type)
SELECT tenant_id, 'SQL Van', 'VEHICLE'
FROM public.tenant_users WHERE role_key = 'Admin' LIMIT 1;


-- 4. Test IN (Initial Load - 100 qty)
SELECT public.api_inventory_in(
    (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001'),
    (SELECT id FROM public.tenant_inventory_locations WHERE name = 'SQL Warehouse'),
    100,
    50.00,
    'Initial Stock'
) as result_in;

-- Verify Stock (Should be 100)
SELECT 'VERIFY IN' as step, * FROM public.tenant_inventory_stock 
WHERE item_id = (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001');


-- 5. Test TRANSFER (Move 10 to Van)
SELECT public.api_inventory_transfer(
    (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001'),
    (SELECT id FROM public.tenant_inventory_locations WHERE name = 'SQL Warehouse'),
    (SELECT id FROM public.tenant_inventory_locations WHERE name = 'SQL Van'),
    10,
    'Restock Van'
) as result_transfer;

-- Verify Stock (Warehouse 90, Van 10)
SELECT 'VERIFY TRANSFER' as step, location_id, quantity 
FROM public.tenant_inventory_stock 
WHERE item_id = (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001')
ORDER BY quantity DESC;


-- 6. Test OUT (Consume 2 from Van)
SELECT public.api_inventory_out(
    (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001'),
    (SELECT id FROM public.tenant_inventory_locations WHERE name = 'SQL Van'),
    2,
    'Job Consumption'
) as result_out;

-- Verify Stock (Van 8)
SELECT 'VERIFY OUT' as step, location_id, quantity 
FROM public.tenant_inventory_stock 
WHERE item_id = (SELECT id FROM public.tenant_catalog_items WHERE sku = 'TEST-SQL-001')
AND location_id = (SELECT id FROM public.tenant_inventory_locations WHERE name = 'SQL Van');


