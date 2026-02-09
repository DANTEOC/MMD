-- Migration: Create Reports Views
-- Description: Views for essential operational reports (Financials, Consumption, Low Stock)

-- 1. VIEW: Work Order Financials
-- Aggregates cost and margin info per Work Order
CREATE OR REPLACE VIEW public.view_report_wo_financials AS
SELECT 
    wo.id,
    wo.tenant_id,
    wo.title,
    wo.status,
    wo.priority,
    wo.subtotal,        -- Total billeable (sin impuestos)
    wo.cost_total,      -- Costo total (materiales + servicios)
    wo.margin,          -- Margen $
    CASE 
        WHEN wo.subtotal > 0 THEN ROUND((wo.margin / wo.subtotal) * 100, 2)
        ELSE 0 
    END as margin_percent,
    wo.created_at,
    wo.updated_at as last_updated,
    auth.users.email as created_by_email
FROM public.tenant_work_orders wo
LEFT JOIN auth.users ON wo.created_by = auth.users.id;

-- 2. VIEW: Inventory Consumption
-- Details of all OUT movements linked to items and locations
CREATE OR REPLACE VIEW public.view_report_inventory_consumption AS
SELECT 
    mov.id,
    mov.tenant_id,
    mov.created_at as movement_date,
    item.name as item_name,
    item.sku,
    mov.quantity,
    mov.unit_cost, -- El costo guardado al momento del movimiento (si se implementó) o 0
    (mov.quantity * COALESCE(NULLIF(mov.unit_cost, 0), item.base_cost)) as estimated_total_cost, -- Fallback to base_cost if unit_cost is 0
    loc.name as location_name,
    mov.reference,
    usr.email as performed_by_email
FROM public.tenant_inventory_movements mov
JOIN public.tenant_catalog_items item ON mov.item_id = item.id
JOIN public.tenant_inventory_locations loc ON mov.location_from_id = loc.id
LEFT JOIN auth.users usr ON mov.performed_by = usr.id
WHERE mov.movement_type = 'OUT';

-- 3. VIEW: Low Stock
-- Items where current stock is below min_stock
CREATE OR REPLACE VIEW public.view_report_low_stock AS
SELECT 
    item.id as item_id,
    item.tenant_id,
    item.name as item_name,
    item.sku,
    item.min_stock,
    COALESCE(SUM(stk.quantity), 0) as current_stock,
    (item.min_stock - COALESCE(SUM(stk.quantity), 0)) as shortage
FROM public.tenant_catalog_items item
LEFT JOIN public.tenant_inventory_stock stk ON item.id = stk.item_id
WHERE item.is_stockable = true 
  AND item.is_active = true
GROUP BY item.id, item.tenant_id, item.name, item.sku, item.min_stock
HAVING COALESCE(SUM(stk.quantity), 0) <= item.min_stock;

-- 4. Permissions (Auto-inherited via RLS on base tables, but Views need owner rights logic if Security Definer used)
-- Standard Views use the permissions of the invoker. 
-- Since we have RLS on base tables, selecting from these views will auto-filter by tenant_id.
-- We just need to grant SELECT to authenticated users (role check done in app layer or RLS).

GRANT SELECT ON public.view_report_wo_financials TO authenticated;
GRANT SELECT ON public.view_report_inventory_consumption TO authenticated;
GRANT SELECT ON public.view_report_low_stock TO authenticated;
