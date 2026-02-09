'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getClients() {
    noStore();
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_clients')
        .select('id, name')
        .eq('tenant_id', auth.tenantId)
        .order('name');

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data || [];
}

export async function createClientAction(formData: FormData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase
        .from('tenant_clients')
        .insert({
            tenant_id: auth.tenantId,
            name,
            email: email || null,
            phone: phone || null,
            notes: notes || null
        });

    if (error) {
        throw new Error('Error creating client: ' + error.message);
    }

    redirect('/clients');
}

import { revalidatePath } from 'next/cache';

export async function deleteClient(id: string) {
    const auth = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
        .from('tenant_clients')
        .delete()
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        throw new Error('Error deleting client: ' + error.message);
    }

    revalidatePath('/clients');
    redirect('/clients');
}

export async function updateClient(id: string, formData: FormData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase
        .from('tenant_clients')
        .update({
            name,
            email: email || null,
            phone: phone || null,
            notes: notes || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        throw new Error('Error updating client: ' + error.message);
    }

    revalidatePath('/clients');
    revalidatePath(`/clients/${id}`);
    redirect('/clients');
}
