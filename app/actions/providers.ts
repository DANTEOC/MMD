'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export type Provider = {
    id: string;
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    tax_id?: string;
    payment_terms?: string;
    is_active: boolean;
};

export async function getProviders() {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador', 'Operador'].includes(auth.roleKey)) {
        return [];
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from('tenant_providers')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching providers:', error);
        return [];
    }

    return data || [];
}

export async function createProviderAction(formData: FormData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        throw new Error('No tienes permisos para crear proveedores');
    }

    const name = formData.get('name')?.toString();

    if (!name) {
        throw new Error('El nombre es requerido');
    }

    const supabase = await createClient();
    const { error } = await supabase.from('tenant_providers').insert({
        tenant_id: auth.tenantId,
        name: name,
        contact_name: formData.get('contact_name')?.toString() || null,
        email: formData.get('email')?.toString() || null,
        phone: formData.get('phone')?.toString() || null,
        tax_id: formData.get('tax_id')?.toString() || null,
        payment_terms: formData.get('payment_terms')?.toString() || null,
    });

    if (error) throw new Error(error.message);
    revalidatePath('/finance/providers');
}

export async function updateProviderAction(id: string, formData: FormData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor', 'Contador'].includes(auth.roleKey)) {
        throw new Error('No tienes permisos para editar proveedores');
    }

    const supabase = await createClient();
    const { error } = await supabase.from('tenant_providers').update({
        name: formData.get('name')?.toString(),
        contact_name: formData.get('contact_name')?.toString() || null,
        email: formData.get('email')?.toString() || null,
        phone: formData.get('phone')?.toString() || null,
        tax_id: formData.get('tax_id')?.toString() || null,
        payment_terms: formData.get('payment_terms')?.toString() || null,
        is_active: formData.get('is_active') === 'on'
    }).eq('id', id).eq('tenant_id', auth.tenantId);

    if (error) throw new Error(error.message);
    revalidatePath('/finance/providers');
}
