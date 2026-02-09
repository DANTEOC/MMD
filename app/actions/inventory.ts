'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

// Helper for logging
async function logActivity(supabase: any, tenantId: string, userId: string, action: string, entity: string, entityId: string, details: any) {
    await supabase.from('tenant_activity_logs').insert({
        tenant_id: tenantId,
        user_id: userId,
        action,
        entity,
        entity_id: entityId,
        details
    });
}

export type CatalogItem = {
    id: string;
    kind: 'PRODUCT' | 'SERVICE';
    name: string;
    description: string | null;
    unit: string;
    min_stock: number;
    is_stockable: boolean;
    is_active: boolean;
};

// --- ITEMS ---

export async function getItems() {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_catalog_items')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

    if (error) throw new Error(error.message);
    return data;
}

export async function createItem(formData: FormData) {
    const { tenantId, roleKey, userId } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) throw new Error('Unauthorized');

    const supabase = await createClient();
    const kind = formData.get('kind') as string;
    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;
    const min_stock = formData.get('min_stock') ? Number(formData.get('min_stock')) : 0;
    const description = formData.get('description') as string;

    const { data, error } = await supabase.from('tenant_catalog_items').insert({
        tenant_id: tenantId,
        kind,
        name,
        unit,
        min_stock,
        description,
        is_stockable: kind === 'PRODUCT',
    }).select().single();

    if (error) return { success: false, error: error.message };

    await logActivity(supabase, tenantId, userId, 'CREATE', 'ITEM', data.id, { name, kind });

    revalidatePath('/inventory/catalog');
    return { success: true };
}

export async function updateItem(formData: FormData) {
    const { tenantId, roleKey, userId } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();
    const id = formData.get('id') as string;
    const kind = formData.get('kind') as string;
    const name = formData.get('name') as string;
    const unit = formData.get('unit') as string;
    const min_stock = formData.get('min_stock') ? Number(formData.get('min_stock')) : 0;
    const description = formData.get('description') as string;

    // Check if item exists and belongs to tenant
    const { error } = await supabase
        .from('tenant_catalog_items')
        .update({
            kind,
            name,
            unit,
            min_stock,
            description,
            is_stockable: kind === 'PRODUCT',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) return { success: false, error: error.message };

    await logActivity(supabase, tenantId, userId, 'UPDATE', 'ITEM', id, { name, kind, updates: { name, unit, min_stock } });

    revalidatePath('/inventory/catalog');
    return { success: true };
}

export async function toggleItemStatus(id: string, isActive: boolean) {
    const { tenantId, roleKey, userId } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) return { success: false, error: 'Unauthorized' };

    const supabase = await createClient();
    const { error } = await supabase
        .from('tenant_catalog_items')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) return { success: false, error: error.message };

    await logActivity(supabase, tenantId, userId, isActive ? 'ACTIVATE' : 'SUSPEND', 'ITEM', id, { isActive });

    revalidatePath('/inventory/catalog');
    return { success: true };
}

// --- LOCATIONS ---

export async function getLocations() {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_inventory_locations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name');

    if (error) throw new Error(error.message);
    return data;
}

export async function createLocation(formData: FormData) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) throw new Error('Unauthorized');

    const supabase = await createClient();
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;

    const { error } = await supabase.from('tenant_inventory_locations').insert({
        tenant_id: tenantId,
        name,
        type
    });

    if (error) return { success: false, error: error.message };
    revalidatePath('/inventory/locations');
    return { success: true };
}

export async function updateLocation(formData: FormData) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) throw new Error('Unauthorized');

    const supabase = await createClient();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const is_active = formData.get('is_active') === 'true';

    const { error } = await supabase
        .from('tenant_inventory_locations')
        .update({ name, type, is_active })
        .eq('id', id)
        .eq('tenant_id', tenantId);

    if (error) return { success: false, error: error.message };
    revalidatePath('/inventory/locations');
    return { success: true };
}

// --- STOCK ---

export async function getStock() {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    // Join with items and locations for display
    const { data, error } = await supabase
        .from('tenant_inventory_stock')
        .select(`
            quantity,
            last_verified_at,
            item:tenant_catalog_items(id, name, unit, min_stock, sku),
            location:tenant_inventory_locations(id, name, type)
        `)
        .eq('tenant_id', tenantId)
        .order('quantity', { ascending: false }); // Show highest stock first

    if (error) throw new Error(error.message);
    return data;
}

// --- MOVEMENTS & ACTIONS ---

export async function getMovements() {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_inventory_movements')
        .select(`
            *,
            item:tenant_catalog_items(name, unit),
            from:location_from_id(name),
            to:location_to_id(name)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) throw new Error(error.message);
    return data;
}

export async function inventoryIn(formData: FormData) {
    const { tenantId } = await requireAuth(); // Role check done in RPC logic too, but also guard here
    const supabase = await createClient();

    // RPC requires parameters
    const params = {
        p_item_id: formData.get('item_id'),
        p_location_to_id: formData.get('location_to_id'),
        p_quantity: Number(formData.get('quantity')),
        p_unit_cost: 0, // Simplified for now
        p_reference: formData.get('reference') || 'Manual Entry'
    };

    const { data, error } = await supabase.rpc('api_inventory_in', params);

    if (error) return { success: false, error: error.message };
    revalidatePath('/inventory/stock');
    revalidatePath('/inventory/movements');
    return { success: true, data };
}

export async function inventoryOut(formData: FormData) {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    const params = {
        p_item_id: formData.get('item_id'),
        p_location_from_id: formData.get('location_from_id'),
        p_quantity: Number(formData.get('quantity')),
        p_reference: formData.get('reference') || 'Manual Exit'
    };

    const { data, error } = await supabase.rpc('api_inventory_out', params);

    if (error) return { success: false, error: error.message };
    revalidatePath('/inventory/stock');
    revalidatePath('/inventory/movements');
    return { success: true, data };
}

export async function inventoryTransfer(formData: FormData) {
    const { tenantId } = await requireAuth();
    const supabase = await createClient();

    const params = {
        p_item_id: formData.get('item_id'),
        p_location_from_id: formData.get('location_from_id'),
        p_location_to_id: formData.get('location_to_id'),
        p_quantity: Number(formData.get('quantity')),
        p_reference: formData.get('reference') || 'Transfer'
    };

    const { data, error } = await supabase.rpc('api_inventory_transfer', params);

    if (error) return { success: false, error: error.message };
    revalidatePath('/inventory/stock');
    revalidatePath('/inventory/movements');
    return { success: true, data };
}

export async function adjustStockTarget(formData: FormData) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(roleKey)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();
    const itemId = formData.get('item_id');
    const locationId = formData.get('location_id');
    const targetQty = Number(formData.get('target_qty'));
    const reasonCode = formData.get('reason_code');
    const notes = formData.get('notes');

    const { data, error } = await supabase.rpc('api_inventory_adjust_target', {
        p_item_id: itemId,
        p_location_id: locationId,
        p_target_qty: targetQty,
        p_reason_code: reasonCode,
        p_notes: notes
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/inventory/stock');
    revalidatePath('/inventory/movements');
    return { success: true, data };
}

export async function returnStock(formData: FormData) {
    const { tenantId, roleKey } = await requireAuth();
    if (!['Admin', 'Supervisor', 'Tecnico'].includes(roleKey)) {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();
    const itemId = formData.get('item_id');
    const locationId = formData.get('location_id');
    const qty = Number(formData.get('quantity'));
    const notes = formData.get('notes');
    const referenceType = formData.get('reference_type') as string;
    const referenceId = formData.get('reference_id') as string;
    const reasonCode = formData.get('reason_code') || 'MANUAL_RETURN';

    const { data, error } = await supabase.rpc('api_inventory_return', {
        p_item_id: itemId,
        p_location_id: locationId,
        p_quantity: qty,
        p_reason_code: reasonCode,
        p_reference_type: referenceType,
        p_reference_id: referenceId || null,
        p_notes: notes
    });

    if (error) return { success: false, error: error.message };

    revalidatePath('/inventory/stock');
    revalidatePath('/inventory/movements');
    if (referenceType === 'OS' && referenceId) {
        revalidatePath(`/work-orders/${referenceId}`);
    }

    return { success: true };
}
