-- Migration: Create Work Order Audit Trail (Events)
-- Description: Immutable log of changes in work orders

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.tenant_work_order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES public.tenant_work_orders(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_changed', 'priority_changed', 'technician_changed', 'note_added', 'service_type_changed')),
    
    old_value JSONB,
    new_value JSONB,
    
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_wo_events_wo_id 
ON public.tenant_work_order_events(tenant_id, work_order_id);

CREATE INDEX IF NOT EXISTS idx_wo_events_created 
ON public.tenant_work_order_events(tenant_id, created_at);

-- 2. RLS
ALTER TABLE public.tenant_work_order_events ENABLE ROW LEVEL SECURITY;

-- SELECT: 
-- Admin/Operador can see ALL events in their tenant
-- Tecnico can see events ONLY for orders assigned to them (or maybe all orders? Requirement says "only assigned").
-- Let's stick to "assigned" for technicians if that matches WO policy, usually simpler is "if I can see the WO, I can see its events".
-- Since WO policy allows technicians to see primarily their assigned WOs (conceptually), we can reuse that logic or simply:
-- "If user is member of tenant AND (Role is Admin/Operador OR (Role is Tecnico/Lectura AND WO is assigned?))"
-- Simpler approach: "If user can select the parent work_order, they can select the events".
-- BUT RLS on child table usually needs a join or duplication of logic.
-- Efficient RLS: 
CREATE POLICY "View Events based on WO access" ON public.tenant_work_order_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_work_orders wo
            WHERE wo.id = tenant_work_order_events.work_order_id
            -- Re-check access logic:
            -- 1. Same tenant
            AND wo.tenant_id = tenant_work_order_events.tenant_id
            -- 2. User has access to this tenant.
             AND EXISTS (
                SELECT 1 FROM public.tenant_users tu
                WHERE tu.tenant_id = wo.tenant_id
                AND tu.user_id = auth.uid()
                AND tu.is_active = true
                -- Role check:
                -- Admin/Operador: All good.
                -- Tecnico: Must be assigned? Or if system allows Technicians to see 'unassigned' they should see events too?
                -- Given Ticket A-06 said "Tecnico sees only assigned", we enforce:
                AND (
                    tu.role_key IN ('Admin', 'Operador', 'Lectura') -- Let's allow Lectura to see all for now or strict? Ticket says "Lectura: puede ver".
                    OR 
                    (tu.role_key = 'Tecnico' AND wo.assigned_to = auth.uid())
                )
             )
        )
    );

-- INSERT: Only Authenticated (Server actions will perform this) via same tenant check
CREATE POLICY "Insert Events" ON public.tenant_work_order_events
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenant_users tu
            WHERE tu.tenant_id = tenant_work_order_events.tenant_id
            AND tu.user_id = auth.uid()
            AND tu.is_active = true
        )
    );

-- UPDATE/DELETE: Denied (Immutable)
-- No policies created = Deny all by default in Supabase/Postgres RLS for those operations if not defined.
-- Explicitly, we leave them undefined.

