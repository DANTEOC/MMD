'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export async function getTenantSettings() {
    const auth = await requireAuth();
    // Allow read access for wider roles if needed for UI, but update is Admin only.
    // Assuming 'Admin' can see settings.
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return null;
    }

    const supabase = await createClient();
    const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', auth.tenantId)
        .single();

    return data;
}

export async function updateTenantSettings(formData: FormData) {
    const auth = await requireAuth();
    if (auth.roleKey !== 'Admin') {
        return { success: false, error: 'Solo Administradores pueden cambiar la configuración.' };
    }

    const supabase = await createClient();

    // Extract fields
    const updates: any = {
        tax_id: formData.get('tax_id'),
        address_street: formData.get('address_street'),
        address_city: formData.get('address_city'),
        address_state: formData.get('address_state'),
        address_zip: formData.get('address_zip'),
        contact_name: formData.get('contact_name'),
        contact_phone: formData.get('contact_phone'),
        terms_conditions: formData.get('terms_conditions'),
        footer_text: formData.get('footer_text'),
        logo_url: formData.get('logo_url'), // Direct URL update for now
        updated_at: new Date().toISOString()
    };

    // Filter undefined/null if needed, but FormData.get returns null if missing, or empty string.
    // We want to allow clearing values, so empty string is valid.

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', auth.tenantId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/work-orders'); // Refresh prints
    return { success: true };
}
