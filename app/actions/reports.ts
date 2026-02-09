'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { getUserProfile } from '@/app/actions/users'; // Assuming this exists or we check role manually

/**
 * Helper to ensure user has report access (Admin, Supervisor, Lectura, Contador)
 * Explicitly denies 'Tecnico'
 */
async function requireReportAccess() {
    const auth = await requireAuth();
    // Double check specific role permissions
    // We can use the view RLS, but explicit check prevents unnecessary queries
    // Assuming requireAuth checked basic tenant access.
    // Let's get the specific role from the session or DB
    const supabase = await createClient();
    const { data: userRole } = await supabase
        .from('tenant_users')
        .select('role_key')
        .eq('user_id', auth.userId)
        .eq('tenant_id', auth.tenantId)
        .single();

    if (!userRole || userRole.role_key === 'Tecnico') {
        throw new Error('Access Denied: Reports are not available for this role.');
    }

    return auth;
}

export type ReportDateFilter = {
    startDate?: string;
    endDate?: string;
};

/**
 * Report 1: Work Order Financials
 */
export async function getReportWOFinancials(filters?: ReportDateFilter) {
    const auth = await requireReportAccess();
    const supabase = await createClient();

    let query = supabase
        .from('view_report_wo_financials')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false });

    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
}

/**
 * Report 2: Inventory Consumption
 */
export async function getReportInventoryConsumption(filters?: ReportDateFilter) {
    const auth = await requireReportAccess();
    const supabase = await createClient();

    let query = supabase
        .from('view_report_inventory_consumption')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('movement_date', { ascending: false });

    if (filters?.startDate) {
        query = query.gte('movement_date', filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte('movement_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
}

/**
 * Report 3: Low Stock
 */
export async function getReportLowStock() {
    const auth = await requireReportAccess();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('view_report_low_stock')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('shortage', { ascending: false }); // Most critical first

    if (error) throw new Error(error.message);
    return data || [];
}
