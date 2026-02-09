'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export type Supplier = {
    id: string;
    name: string;
    tax_id: string | null;
    contact_info: string | null;
    is_active: boolean;
    created_at: string;
};

export async function getSuppliers() {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_providers') // Usando tabla existente
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

    if (error) throw new Error(error.message);
    return data as Supplier[];
}

export async function createSupplier(formData: FormData) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) throw new Error('Unauthorized');

    const supabase = await createClient();
    const name = formData.get('name') as string;
    const tax_id = formData.get('tax_id') as string;
    const contact_info = formData.get('contact_info') as string;

    const { error } = await supabase.from('tenant_providers').insert({
        tenant_id: tenantId,
        name,
        tax_id,
        contact_info,
        is_active: true
    });

    if (error) return { success: false, error: error.message };
    revalidatePath('/suppliers');
    return { success: true };
}

export async function updateSupplier(id: string, formData: FormData) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) throw new Error('Unauthorized');

    const supabase = await createClient();
    const name = formData.get('name') as string;
    const tax_id = formData.get('tax_id') as string;
    const contact_info = formData.get('contact_info') as string;

    const { error } = await supabase
        .from('tenant_providers')
        .update({
            name,
            tax_id,
            contact_info,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/suppliers');
    return { success: true };
}

export async function toggleSupplierStatus(id: string, isActive: boolean) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) throw new Error('Unauthorized');

    const supabase = await createClient();
    const { error } = await supabase
        .from('tenant_providers')
        .update({
            is_active: isActive,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/suppliers');
    return { success: true };
}
