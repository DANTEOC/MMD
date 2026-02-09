'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';

export type TechnicianStats = {
    activeOrdersCount: number;
    pendingOrdersCount: number;
    itemsConsumedToday: number;
};

export async function getTechnicianStats(): Promise<TechnicianStats> {
    const auth = await requireAuth();
    const supabase = await createClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // 1. Items Consumed Today (Count of movements OUT performed by me)
    const { count: itemsConsumedCount, error: consumeError } = await supabase
        .from('tenant_inventory_movements')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', auth.tenantId)
        .eq('movement_type', 'OUT')
        .eq('performed_by', auth.userId)
        .gte('created_at', todayStr);

    if (consumeError) {
        console.error('Error fetching technician stats (consumption):', consumeError);
    }

    // 2. Active Orders (assigned to me, in_progress)
    const { count: activeCount, error: activeError } = await supabase
        .from('tenant_work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', auth.tenantId)
        .eq('assigned_to', auth.userId)
        .eq('status', 'in_progress');

    // 3. Pending Orders (assigned to me, pending)
    const { count: pendingCount, error: pendingError } = await supabase
        .from('tenant_work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', auth.tenantId)
        .eq('assigned_to', auth.userId)
        .eq('status', 'pending');

    return {
        activeOrdersCount: activeCount || 0,
        pendingOrdersCount: pendingCount || 0,
        itemsConsumedToday: itemsConsumedCount || 0
    };
}
