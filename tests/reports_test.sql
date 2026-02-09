-- SQL Verification Script for Reports (Views)
-- Run in Supabase SQL Editor

-- 1. Verify WO Financials View
-- Should show the test WO created in previous steps
SELECT 
    'FINANCIALS' as report_type,
    title, status, subtotal, cost_total, margin, margin_percent
FROM public.view_report_wo_financials 
WHERE title LIKE 'Integration Test%';

-- 2. Verify Consumption View
-- Should show the integration test consumption
SELECT 
    'CONSUMPTION' as report_type,
    item_name, quantity, estimated_total_cost, location_name, reference
FROM public.view_report_inventory_consumption
WHERE reference LIKE 'WO Consumo%';

-- 3. Verify Low Stock View
-- Let's force an item to be low stock to verify
-- (Assuming Integration Filter was left with stock 48, set min to 50)
UPDATE public.tenant_catalog_items 
SET min_stock = 100 
WHERE sku = 'INT-001';

SELECT 
    'LOW_STOCK' as report_type,
    item_name, min_stock, current_stock, shortage
FROM public.view_report_low_stock
WHERE sku = 'INT-001';
