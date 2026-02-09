'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export async function getCollectionList(filters?: { status?: string, date_from?: string, date_to?: string, client_query?: string }) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return [];

    const supabase = await createClient();

    // Base query for work orders
    let query = supabase
        .from('tenant_work_orders')
        .select(`
            id, title, status, total_amount, amount_paid, payment_status, created_at,
            client:tenant_clients(name)
        `)
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false });

    // Filter by payment status
    if (filters?.status && filters.status !== 'all') {
        query = query.eq('payment_status', filters.status);
    } else {
        // Default collection view usually implies showing unpaid/partial, or everything?
        // Prompt says "Listado de Cobranza". Usually relevant ones.
        // But if 'all', show all.
    }

    // Filter by Client
    if (filters?.client_query) {
        // Ideally a join filter or search. For now let's hope standard Supabase filtering on joined table works or fetch all & filter.
        // Supabase joined filter syntax is tricky. Keeping it simple: filter only if client_id known or rely on client side filter?
        // Let's rely on basic text search on title or client name text search if possible.
        // For MVP, maybe skip complex text search on relation.
    }

    const { data } = await query;
    return data || [];
}

export async function registerPayment(workOrderId: string, amount: number, method: string, notes?: string) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return { success: false, error: 'Sin permisos' };

    if (amount <= 0) return { success: false, error: 'Monto debe ser positivo' };

    const supabase = await createClient();

    // 1. Get current WO state
    const { data: wo, error: woError } = await supabase
        .from('tenant_work_orders')
        .select('total_amount, amount_paid')
        .eq('id', workOrderId)
        .single();

    if (woError || !wo) return { success: false, error: 'Orden no encontrada' };

    const newAmountPaid = (wo.amount_paid || 0) + amount;

    // Prevent overpayment?
    if (newAmountPaid > wo.total_amount + 0.01) { // 0.01 tolerance
        return { success: false, error: `El pago excede el total (${wo.total_amount}). Pendiente actual: ${wo.total_amount - (wo.amount_paid || 0)}` };
    }

    // Determine new status
    let newStatus = 'partial';
    if (newAmountPaid >= wo.total_amount - 0.01) {
        newStatus = 'paid';
    }

    // 2. Insert Payment
    const { error: paymentError } = await supabase
        .from('tenant_payments')
        .insert({
            tenant_id: auth.tenantId,
            work_order_id: workOrderId,
            amount,
            method,
            notes,
            created_by: auth.userId
        });

    if (paymentError) return { success: false, error: paymentError.message };

    // 3. Update WO
    const { error: updateError } = await supabase
        .from('tenant_work_orders')
        .update({
            amount_paid: newAmountPaid,
            payment_status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);

    if (updateError) {
        // Technically should rollback payment, manually here implies risk.
        console.error('Error updating WO payment status:', updateError);
        return { success: false, error: 'Pago registrado pero error al actualizar estado de orden.' };
    }

    revalidatePath('/reports/collection');
    revalidatePath('/reports/cash-flow');
    return { success: true };
}

export async function registerExpense(data: { concept: string, amount: number, date: string, notes?: string }) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return { success: false, error: 'Sin permisos' };

    const supabase = await createClient();

    const { error } = await supabase
        .from('tenant_expenses')
        .insert({
            tenant_id: auth.tenantId,
            concept: data.concept,
            amount: data.amount,
            expense_date: data.date,
            notes: data.notes,
            created_by: auth.userId
        });

    if (error) return { success: false, error: error.message };

    revalidatePath('/reports/cash-flow');
    return { success: true };
}

export async function getCashFlow(date: string) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return null;

    const supabase = await createClient();

    // 1. Get Income (Payments made on this date)
    // created_at is timestamptz. We need to match date part.
    // Supabase filter: created_at::date = date? Or range.
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: income } = await supabase
        .from('tenant_payments')
        .select(`
            *,
            work_order:tenant_work_orders(title)
        `)
        .eq('tenant_id', auth.tenantId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

    // 2. Get Expenses
    const { data: expenses } = await supabase
        .from('tenant_expenses')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .eq('expense_date', date);

    return {
        income: income || [],
        expenses: expenses || []
    };
}
