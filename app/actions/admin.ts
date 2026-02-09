'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';

export type AdminStats = {
    activeOrdersCount: number;
    pendingOrdersCount: number;
    lowStockCount: number;
    overdueOrdersCount: number;
};

export async function getAdminStats(): Promise<AdminStats> {
    const auth = await requireAuth();
    const supabase = await createClient();

    // 1. Order Counts
    const { count: activeCount } = await supabase
        .from('tenant_work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', auth.tenantId)
        .eq('status', 'in_progress');

    const { count: pendingCount } = await supabase
        .from('tenant_work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', auth.tenantId)
        .eq('status', 'pending');

    // Overdue logic might require comparing dates if you have a due_date column. 
    // For now assuming just pending status or a specific query if due_date exists.
    // Let's check schema later. For strictly counting "Pending" is enough for basic KPI.
    // If strict overdue is needed, we need check schema. I'll stick to pending/active for now.

    const overdueOrdersCount = 0; // Placeholder until due_date is confirmed

    // 2. Low Stock Count
    // Assuming tenant_inventory_items has min_quantity and current_quantity
    const { count: lowStockCount } = await supabase
        .from('tenant_inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', auth.tenantId)
        .lt('current_quantity', 10); // Arbitrary threshold or use min_quantity column if exists.
    // Better: .expr('current_quantity < min_quantity') if both exist. To be safe, I'll do a simple query or check schema.

    // Let's do a robust query if possible, otherwise simple check.
    // I will read schema in next step to refine this if needed. 
    // For now, let's assume filtering by a fixed threshold or a boolean flag if it existed.
    // Actually, let's try to query by min_quantity comparison if possible in PostgREST or just simple now.

    // NOTE: Supabase PostgREST doesn't support comparing two columns directly in filter easily without RPC or computed column.
    // I'll stick to a simple query for now or fix it after checking schema.

    return {
        activeOrdersCount: activeCount || 0,
        pendingOrdersCount: pendingCount || 0,
        lowStockCount: lowStockCount || 0,
        overdueOrdersCount: overdueOrdersCount
    };
}
