'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export type BankAccount = {
    id: string;
    tenant_id: string;
    name: string;
    bank_name: string;
    account_number: string;
    currency: 'MXN' | 'USD' | 'EUR';
    initial_balance: number;
    current_balance?: number;
    is_active: boolean;
    created_at: string;
};

export async function getBanks() {
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_bank_accounts')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching banks:', error);
        return [];
    }

    // Sumar transacciones al saldo inicial
    const { data: transactions } = await supabase
        .from('tenant_bank_transactions')
        .select('bank_account_id, amount')
        .eq('tenant_id', auth.tenantId);

    return (data || []).map(bank => {
        const netAmount = (transactions || [])
            .filter(t => t.bank_account_id === bank.id)
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);
        return {
            ...bank,
            current_balance: Number(bank.initial_balance || 0) + netAmount
        } as BankAccount;
    });
}

export async function createBankAction(formData: FormData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // Validar permisos
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        throw new Error('No autorizado para crear cuentas bancarias');
    }

    const name = formData.get('name') as string;
    const bank_name = formData.get('bank_name') as string;
    const account_number = formData.get('account_number') as string;
    const currency = formData.get('currency') as string;
    const initial_balance = parseFloat((formData.get('initial_balance') as string) || '0');

    if (!name || !bank_name || !account_number || !currency) {
        throw new Error('Faltan campos requeridos');
    }

    const { error } = await supabase
        .from('tenant_bank_accounts')
        .insert({
            tenant_id: auth.tenantId,
            name,
            bank_name,
            account_number,
            currency,
            initial_balance,
            is_active: true
        });

    if (error) {
        throw new Error('Error al crear banco: ' + error.message);
    }

    revalidatePath('/banks');
}

export async function updateBankAction(id: string, formData: FormData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // Validar permisos
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        throw new Error('No autorizado para editar cuentas bancarias');
    }

    const name = formData.get('name') as string;
    const bank_name = formData.get('bank_name') as string;
    const account_number = formData.get('account_number') as string;
    const currency = formData.get('currency') as string;
    const is_active = formData.get('is_active') === 'on';

    if (!name || !bank_name || !account_number) {
        throw new Error('Faltan campos requeridos');
    }

    const { error } = await supabase
        .from('tenant_bank_accounts')
        .update({
            name,
            bank_name,
            account_number,
            currency,
            is_active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        throw new Error('Error al actualizar banco: ' + error.message);
    }

    revalidatePath('/banks');
}

export async function deleteBankAction(id: string) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // Validar permisos (Solo Admin)
    if (auth.roleKey !== 'Admin') {
        throw new Error('Solo Administradores pueden eliminar cuentas bancarias');
    }

    const { error } = await supabase
        .from('tenant_bank_accounts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        throw new Error('Error al eliminar banco: ' + error.message);
    }

    revalidatePath('/banks');
}
