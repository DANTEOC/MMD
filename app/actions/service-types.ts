'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export async function getServiceTypes(activeOnly = false) {
    noStore();
    const auth = await requireAuth();
    const supabase = await createClient();

    let query = supabase
        .from('tenant_service_types')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('name');

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching service types:', error);
        return [];
    }

    return data || [];
}

export async function createServiceType(formData: FormData) {
    const auth = await requireAuth();

    // Authorization check (Admin/Operador)
    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!name?.trim()) {
        return { success: false, error: 'El nombre es requerido' };
    }

    const { error } = await supabase
        .from('tenant_service_types')
        .insert({
            tenant_id: auth.tenantId,
            name: name.trim(),
            description: description?.trim(),
            is_active: true
        });

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: false, error: 'Ya existe un tipo de servicio con este nombre' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/service-types');
    return { success: true };
}

export async function updateServiceType(id: string, formData: FormData) {
    const auth = await requireAuth();

    // Authorization check
    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const isActive = formData.get('is_active') === 'on';

    const { error } = await supabase
        .from('tenant_service_types')
        .update({
            name: name.trim(),
            description: description?.trim(),
            is_active: isActive, // Or logic to toggle separately
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Ya existe un tipo de servicio con este nombre' };
        }
        return { success: false, error: error.message };
    }

    revalidatePath('/service-types');
    return { success: true };
}

export async function toggleServiceType(id: string, currentState: boolean) {
    const auth = await requireAuth();

    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('tenant_service_types')
        .update({
            is_active: !currentState,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/service-types');
    return { success: true };
}
