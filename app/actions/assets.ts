'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { unstable_noStore as noStore } from 'next/cache';

export async function getAssets(clientId: string) {
    noStore();
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_assets')
        .select('id, name')
        .eq('tenant_id', auth.tenantId)
        .eq('client_id', clientId)
        .order('name');

    if (error) {
        console.error('Error fetching assets:', error);
        return [];
    }

    return data || [];
}

export async function createAssetAction(formData: FormData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    const client_id = formData.get('client_id') as string;
    const name = formData.get('name') as string;
    const asset_type = formData.get('asset_type') as string;
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : null;
    const serial = formData.get('serial') as string;
    const notes = formData.get('notes') as string;

    if (!client_id || !name || !asset_type) {
        throw new Error('Faltan campos requeridos');
    }

    const { error } = await supabase
        .from('tenant_assets')
        .insert({
            tenant_id: auth.tenantId,
            client_id,
            name,
            asset_type,
            make,
            model,
            year,
            serial,
            notes
        });

    if (error) {
        throw new Error('Error al crear activo: ' + error.message);
    }

    const { redirect } = await import('next/navigation');
    redirect('/assets');
}

export async function deleteAssetAction(assetId: string) {
    const auth = await requireAuth();

    // Solo Admin puede borrar? O también Operador?
    // Según reglas: "Admin" can delete. "Operador" can edit. 
    // Vamos a restringir borrado a Admin por seguridad, o seguir reglas de UI.
    // El botón Delete solo aparece si canDelete es true.
    if (auth.roleKey !== 'Admin') {
        throw new Error('No autorizado para eliminar activos');
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('tenant_assets')
        .delete()
        .eq('id', assetId)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        throw new Error('Error al eliminar activo: ' + error.message);
    }

    const { redirect } = await import('next/navigation');
    redirect('/assets');
}

export async function updateAssetAction(id: string, formData: FormData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    const name = formData.get('name') as string;
    const asset_type = formData.get('asset_type') as string;
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : null;
    const serial = formData.get('serial') as string;
    const notes = formData.get('notes') as string;

    if (!name || !asset_type) {
        throw new Error('Faltan campos requeridos');
    }

    const { error } = await supabase
        .from('tenant_assets')
        .update({
            name,
            asset_type,
            make,
            model,
            year,
            serial,
            notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        throw new Error('Error al actualizar activo: ' + error.message);
    }

    const { redirect } = await import('next/navigation');
    redirect('/assets');
}
