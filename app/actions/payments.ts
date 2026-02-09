'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export type AddPaymentData = {
    work_order_id: string;
    amount: number;
    payment_method: 'cash' | 'transfer' | 'card' | 'check';
    reference?: string;
    payment_date: string;
    bank_account_id?: string;
    notes?: string;
};

/**
 * Obtener pagos de una Work Order
 */
export async function getWorkOrderPayments(workOrderId: string) {
    noStore();
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_payments')
        .select(`
            *,
            bank_account:tenant_bank_accounts(name)
        `)
        .eq('work_order_id', workOrderId)
        .eq('tenant_id', auth.tenantId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data || [];
}

/**
 * Registrar un nuevo pago
 */
export async function addWorkOrderPayment(data: AddPaymentData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // 1. Insert Payment Record
    const { data: newPayment, error: paymentError } = await supabase
        .from('tenant_payments')
        .insert({
            tenant_id: auth.tenantId,
            work_order_id: data.work_order_id,
            amount: data.amount,
            payment_method: data.payment_method,
            reference: data.reference,
            payment_date: data.payment_date,
            bank_account_id: data.bank_account_id,
            notes: data.notes,
            created_by: auth.userId
        })
        .select()
        .single();

    if (paymentError) {
        console.error('Error adding payment:', paymentError);
        return { success: false, error: paymentError.message };
    }

    // 2. Update Work Order (Paid Amount & Status)
    const { data: wo } = await supabase
        .from('tenant_work_orders')
        .select('total_amount, amount_paid')
        .eq('id', data.work_order_id)
        .single();

    if (wo) {
        const newPaid = (Number(wo.amount_paid) || 0) + Number(data.amount);
        let newStatus = 'partial';
        if (newPaid >= (Number(wo.total_amount) || 0) && (Number(wo.total_amount) > 0)) {
            newStatus = 'paid';
        }

        await supabase.from('tenant_work_orders').update({
            amount_paid: newPaid,
            payment_status: newStatus
        }).eq('id', data.work_order_id);
    }

    // 3. Update Ledger / Bank Balance
    if (data.bank_account_id) {
        await supabase.from('tenant_bank_transactions').insert({
            tenant_id: auth.tenantId,
            bank_account_id: data.bank_account_id,
            amount: data.amount,
            category: 'payment',
            source_type: 'tenant_payments',
            source_id: newPayment.id,
            description: `Cobro Orden #${data.work_order_id.substring(0, 8).toUpperCase()}`,
            created_by: auth.userId
        });
    }

    revalidatePath(`/work-orders/${data.work_order_id}`);
    revalidatePath('/reports/collection');
    return { success: true, data: newPayment };
}
