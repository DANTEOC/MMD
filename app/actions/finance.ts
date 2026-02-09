'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

// --- HELPERS ---

export async function getBankAccountBalance(bankAccountId: string) {
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data: bank } = await supabase
        .from('tenant_bank_accounts')
        .select('initial_balance')
        .eq('id', bankAccountId)
        .eq('tenant_id', auth.tenantId)
        .single();

    if (!bank) return 0;

    const { data: transactions } = await supabase
        .from('tenant_bank_transactions')
        .select('amount')
        .eq('bank_account_id', bankAccountId)
        .eq('tenant_id', auth.tenantId);

    const netAmount = (transactions || []).reduce((acc, t) => acc + Number(t.amount), 0);
    return Number(bank.initial_balance) + netAmount;
}

// --- PAYMENTS (INGRESOS) ---

export type PaymentData = {
    work_order_id: string;
    amount: number;
    method: 'cash' | 'transfer' | 'card' | 'check' | 'other';
    reference?: string;
    notes?: string;
    bank_account_id?: string; // Optional destination bank
};

export async function registerPaymentAction(data: PaymentData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos para registrar pagos' };
    }

    if (data.amount <= 0) {
        return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    const supabase = await createClient();

    // 1. Insert Payment Record
    const { data: payment, error: paymentError } = await supabase.from('tenant_payments').insert({
        tenant_id: auth.tenantId,
        work_order_id: data.work_order_id,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        bank_account_id: data.bank_account_id,
        created_by: auth.userId
    }).select().single();

    if (paymentError) return { success: false, error: paymentError.message };

    // 2. Update Work Order (Paid Amount & Status)
    // We fetch current totals first to be safe, or use a database trigger.
    // The migration `20260126_create_treasury.sql` lacks a trigger to update paid_amount in `tenant_work_orders`.
    // It has `trg_update_wo_total` for lines, but not for payments.
    // We should update it manually here for now.

    const { data: wo, error: woError } = await supabase
        .from('tenant_work_orders')
        .select('total_amount, amount_paid')
        .eq('id', data.work_order_id)
        .single();

    if (wo) {
        const newPaid = (Number(wo.amount_paid) || 0) + data.amount;
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
    if (data.bank_account_id && payment) {
        await supabase.from('tenant_bank_transactions').insert({
            tenant_id: auth.tenantId,
            bank_account_id: data.bank_account_id,
            amount: data.amount,
            category: 'payment',
            source_type: 'tenant_payments',
            source_id: payment.id,
            description: `Cobro Orden #${data.work_order_id.substring(0, 8).toUpperCase()}`,
            created_by: auth.userId
        });
    }

    revalidatePath(`/work-orders/${data.work_order_id}`);
    return { success: true };
}


export async function registerGeneralIncome(data: { bank_account_id: string, amount: number, category: string, description: string }) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos' };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('tenant_bank_transactions').insert({
        tenant_id: auth.tenantId,
        bank_account_id: data.bank_account_id,
        amount: data.amount,
        category: data.category, // 'loan', 'injection', etc.
        description: data.description,
        created_by: auth.userId
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/banks');
    return { success: true };
}


// --- EXPENSES (EGRESOS / COMPRAS) ---

export type ExpenseData = {
    provider_id?: string; // Optional if "General Public" or null
    purchase_date: string;
    total_amount: number;
    currency: 'MXN' | 'USD' | 'EUR';
    status: 'pending' | 'paid';
    reference?: string;
    notes?: string;
    concept: string; // Used for "reference" or "notes" if not separate
    work_order_id?: string; // Optional link to WO
    bank_account_id?: string; // Account used for payment
};

export async function registerWorkOrderExpense(data: ExpenseData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador', 'Tecnico'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos para registrar gastos' };
    }

    if (!data.work_order_id) {
        return { success: false, error: 'Se requiere ID de Orden de Trabajo' };
    }

    // Balance check
    if (data.status === 'paid' && data.bank_account_id) {
        const balance = await getBankAccountBalance(data.bank_account_id);
        if (balance < data.total_amount) {
            return { success: false, error: `Saldo insuficiente en cuenta. Disponible: ${balance}` };
        }
    }

    const supabase = await createClient();

    // 1. Create Purchase Record
    const { data: purchase, error: purchaseError } = await supabase.from('tenant_purchases').insert({
        tenant_id: auth.tenantId,
        provider_id: data.provider_id || null,
        purchase_date: data.purchase_date,
        total_amount: data.total_amount,
        amount_paid: data.status === 'paid' ? data.total_amount : 0,
        currency: data.currency,
        status: data.status,
        reference: data.reference,
        notes: `${data.concept} - ${data.notes || ''}`,
        work_order_id: data.work_order_id,
        bank_account_id: data.bank_account_id,
        created_by: auth.userId
    }).select().single();

    if (purchaseError) return { success: false, error: 'Error creando compra: ' + purchaseError.message };

    // 2. Ledger Transaction
    if (data.status === 'paid' && data.bank_account_id) {
        await supabase.from('tenant_bank_transactions').insert({
            tenant_id: auth.tenantId,
            bank_account_id: data.bank_account_id,
            amount: -data.total_amount, // Negative for expense
            category: 'purchase',
            source_type: 'tenant_purchases',
            source_id: purchase.id,
            description: `Compra: ${data.concept} (Ref: ${data.reference || '-'})`,
            created_by: auth.userId
        });
    }

    // 3. Add Line to Work Order
    const { error: lineError } = await supabase.rpc('api_work_order_add_line_v2', {
        p_work_order_id: data.work_order_id,
        p_kind: 'MATERIAL',
        p_name: data.concept,
        p_qty: 1,
        p_unit: 'sq',
        p_unit_price: data.total_amount,
        p_cost_unit: data.total_amount,
        p_inventory_movement_id: null
    });

    if (lineError) {
        console.error('Error adding line:', lineError);
        return { success: true, warning: 'Gasto registrado pero error al agregar línea a la orden. Agrégala manualmente.' };
    }

    revalidatePath(`/work-orders/${data.work_order_id}`);
    revalidatePath('/finance/expenses');
    return { success: true };
}

export async function registerExpenseAction(data: ExpenseData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos para registrar gastos' };
    }

    // Balance check
    if (data.status === 'paid' && data.bank_account_id) {
        const balance = await getBankAccountBalance(data.bank_account_id);
        if (balance < data.total_amount) {
            return { success: false, error: `Saldo insuficiente en cuenta. Disponible: ${balance}` };
        }
    }

    const supabase = await createClient();

    const { data: purchase, error } = await supabase.from('tenant_purchases').insert({
        tenant_id: auth.tenantId,
        provider_id: data.provider_id || null,
        purchase_date: data.purchase_date,
        total_amount: data.total_amount,
        amount_paid: data.status === 'paid' ? data.total_amount : 0,
        currency: data.currency,
        status: data.status,
        reference: data.reference,
        notes: `${data.concept} - ${data.notes || ''}`,
        bank_account_id: data.bank_account_id,
        created_by: auth.userId
    }).select().single();

    if (error) return { success: false, error: error.message };

    // Ledger Transaction
    if (data.status === 'paid' && data.bank_account_id) {
        await supabase.from('tenant_bank_transactions').insert({
            tenant_id: auth.tenantId,
            bank_account_id: data.bank_account_id,
            amount: -data.total_amount,
            category: 'purchase',
            source_type: 'tenant_purchases',
            source_id: purchase.id,
            description: `Gasto: ${data.concept} (Ref: ${data.reference || '-'})`,
            created_by: auth.userId
        });
    }

    revalidatePath('/finance/expenses');
    return { success: true };
}

export async function cancelExpenseAction(expenseId: string) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos para cancelar gastos' };
    }

    const supabase = await createClient();

    // 1. Get expense details
    const { data: expense, error: fetchError } = await supabase
        .from('tenant_purchases')
        .select('*')
        .eq('id', expenseId)
        .eq('tenant_id', auth.tenantId)
        .single();

    if (fetchError || !expense) {
        return { success: false, error: 'Gasto no encontrado' };
    }

    if (expense.status === 'cancelled') {
        return { success: false, error: 'El gasto ya está cancelado' };
    }

    // 2. Update purchase status
    const { error: updateError } = await supabase
        .from('tenant_purchases')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', expenseId);

    if (updateError) {
        console.error('Error cancelling purchase:', updateError);
        return { success: false, error: 'Error al cancelar el registro' };
    }

    // 3. Revert Ledger if it was paid
    if (expense.status === 'paid' && expense.bank_account_id) {
        const { error: ledgerError } = await supabase.from('tenant_bank_transactions').insert({
            tenant_id: auth.tenantId,
            bank_account_id: expense.bank_account_id,
            amount: expense.total_amount, // Positive amount to "refund"
            category: 'CANCELACIÓN',
            source_type: 'PURCHASE_CANCEL',
            source_id: expenseId,
            description: `Reverso por cancelación de gasto: ${expense.reference || expense.notes || ''}`,
            created_by: auth.userId
        });

        if (ledgerError) {
            console.error('Error reverting ledger:', ledgerError);
        }
    }

    revalidatePath('/finance/expenses');
    revalidatePath('/finance/transactions');
    revalidatePath('/banks');

    return { success: true };
}


// --- QUOTES (COTIZACIONES) ---

export async function approveQuoteAction(workOrderId: string) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) { // Technicians usually don't approve quotes? Maybe?
        return { success: false, error: 'Sin permisos' };
    }

    const supabase = await createClient();

    // Change status from 'quote' to 'open'
    const { error } = await supabase
        .from('tenant_work_orders')
        .update({ status: 'open' })
        .eq('id', workOrderId)
        .eq('tenant_id', auth.tenantId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/work-orders/${workOrderId}`);
    return { success: true };
}

export async function getExpenses() {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador', 'Operador'].includes(auth.roleKey)) {
        return [];
    }

    const supabase = await createClient();

    // Select with profiles join for attribution
    const { data, error } = await supabase
        .from('tenant_purchases')
        .select(`
            *,
            provider:tenant_providers(name),
            user:profiles!created_by(email, full_name)
        `)
        .eq('tenant_id', auth.tenantId)
        .order('purchase_date', { ascending: false });

    if (error) {
        console.error('Error fetching expenses:', JSON.stringify(error));
        return [];
    }

    return data || [];
}

export async function getTransactions(filters?: { bank_account_id?: string }) {
    const auth = await requireAuth();
    const supabase = await createClient();

    let query = supabase
        .from('tenant_bank_transactions')
        .select(`
            *,
            bank:tenant_bank_accounts(name, bank_name)
        `)
        .eq('tenant_id', auth.tenantId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (filters?.bank_account_id) {
        query = query.eq('bank_account_id', filters.bank_account_id);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }

    return data || [];
}
