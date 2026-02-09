'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

export async function getPurchases(filters?: { status?: string, location_id?: string, provider_id?: string }) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return [];

    const supabase = await createClient();

    let query = supabase
        .from('tenant_purchases')
        .select(`
            *,
            provider:tenant_providers(name),
            location:tenant_inventory_locations(name)
        `)
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }
    if (filters?.location_id && filters.location_id !== 'all') {
        query = query.eq('location_id', filters.location_id);
    }
    if (filters?.provider_id && filters.provider_id !== 'all') {
        query = query.eq('provider_id', filters.provider_id);
    }

    const { data } = await query;
    return data || [];
}

export async function getPurchase(id: string) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return null;

    const supabase = await createClient();
    const { data } = await supabase
        .from('tenant_purchases')
        .select(`
            *,
            provider:tenant_providers(*),
            location:tenant_inventory_locations(*),
            items:tenant_purchase_items(
                *,
                item:tenant_catalog_items(*)
            )
        `)
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .single();

    return data;
}

export type PurchaseData = {
    title: string;
    purchase_date: string;
    responsible_user_id: string;
    payment_method: string;
    provider_id: string;
    location_id: string;
    notes?: string;
    items: {
        item_id: string;
        quantity: number;
        cost_estimated: number;
    }[];
    subtotal_estimated: number;
    tax_rate_estimated: number;
    tax_estimated: number;
};

export async function createPurchase(data: PurchaseData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos' };
    }

    if (!data.items || data.items.length === 0) {
        return { success: false, error: 'Debe agregar al menos un ítem' };
    }

    const supabase = await createClient();

    // 1. Recalculate Subtotal STRICTLY from items (Do not trust client subtotal)
    const calculatedSubtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.cost_estimated), 0);

    // 2. Trust client Tax Amount (to allow manual overrides/rounding diffs), but sanitize
    const finalTax = Math.max(0, data.tax_estimated);

    // 3. Calculate Final Total
    const totalEstimated = calculatedSubtotal + finalTax;

    // 1. Create Purchase Header
    const { data: purchase, error: purchaseError } = await supabase
        .from('tenant_purchases')
        .insert({
            tenant_id: auth.tenantId,
            title: data.title,
            purchase_date: data.purchase_date,
            responsible_user_id: data.responsible_user_id,
            payment_method: data.payment_method,
            provider_id: data.provider_id,
            location_id: data.location_id,
            status: 'pending',
            total_estimated: totalEstimated,
            subtotal_estimated: calculatedSubtotal, // Save calculated, not client provided
            tax_rate_estimated: data.tax_rate_estimated,
            tax_estimated: finalTax,
            notes: data.notes,
            created_by: auth.userId
        })
        .select()
        .single();

    if (purchaseError) {
        return { success: false, error: purchaseError.message };
    }

    // 2. Create Items
    const itemsToInsert = data.items.map(item => ({
        purchase_id: purchase.id,
        item_id: item.item_id,
        quantity_ordered: item.quantity,
        unit_cost_estimated: item.cost_estimated
    }));

    const { error: itemsError } = await supabase
        .from('tenant_purchase_items')
        .insert(itemsToInsert);

    if (itemsError) {
        // Rollback ideally needed, but for MVP pending status allows fix or cleanup.
        // In real world transaction is better but multiple HTTP actions to supabase hard with fetch unless RPC.
        // We assume success for now or user manual cleanup/retry.
        return { success: false, error: 'Error al agregar ítems: ' + itemsError.message };
    }

    revalidatePath('/inventory/purchases');
    return { success: true, id: purchase.id };
}

export async function receivePurchase(id: string, receivedItems: { id: string, quantity: number, cost_real: number }[]) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos' };
    }

    const supabase = await createClient();

    // 1. Verify Status
    const { data: purchase } = await supabase
        .from('tenant_purchases')
        .select('status, location_id')
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .single();

    if (!purchase || purchase.status !== 'pending') {
        return { success: false, error: 'La compra no está pendiente o no existe.' };
    }

    // 2. Loop Items
    // Ideally use a single RPC that handles loop to ensure atomicity, but we can structure this to call `api_inventory_in` per item.
    // If one fails, we have partial receive state, which is risky.
    // Better to update items first, then changing status triggers usage? Or purely client orchestration?
    // Let's do validation then execution loop.

    let totalReal = 0;

    for (const item of receivedItems) {
        if (item.quantity < 0) return { success: false, error: 'Cantidades negativas no permitidas' };
        totalReal += (item.quantity * item.cost_real);
    }

    // Update Items + Inventory Loop. 
    // We'll update the row in purchase_items first, then call inventory_in.

    for (const item of receivedItems) {
        // Find the item definition (to get item_id to pass to api_inventory_in)
        const { data: purchaseItem } = await supabase
            .from('tenant_purchase_items')
            .select('item_id')
            .eq('id', item.id)
            .single();

        if (!purchaseItem) continue;

        // Update purchase item
        await supabase
            .from('tenant_purchase_items')
            .update({
                quantity_received: item.quantity,
                unit_cost_real: item.cost_real
            })
            .eq('id', item.id);

        // Call Inventory IN
        // Only if quantity > 0
        if (item.quantity > 0) {
            const { error: rpcError } = await supabase.rpc('api_inventory_in', {
                p_item_id: purchaseItem.item_id,
                p_location_to_id: purchase.location_id,
                p_quantity: item.quantity,
                p_unit_cost: item.cost_real,
                p_reference: `PURCHASE-${id.split('-')[0].toUpperCase()}`
            });

            if (rpcError) {
                console.error('Inventory IN Error:', rpcError);
                // Continue? Or Fail? For now log. Risks inconsistent stock if failure mid-loop.
            }
        }
    }

    // Update Purchase Header
    await supabase
        .from('tenant_purchases')
        .update({
            status: 'received',
            total_real: totalReal,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    revalidatePath(`/inventory/purchases/${id}`);
    revalidatePath('/inventory/purchases');
    revalidatePath('/inventory'); // Update stock view

    return { success: true };
}

export type DirectPurchaseData = {
    provider_id: string;
    location_id: string;
    item_id?: string;
    name: string;
    qty: number;
    cost_unit: number;
    reference?: string;
    notes?: string;
};

/**
 * Crear una compra directa vinculada a una OS
 */
export async function createDirectPurchase(workOrderId: string, data: DirectPurchaseData) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return { success: false, error: 'Sin permisos' };
    }

    const supabase = await createClient();

    // 1. Create Purchase record
    const { data: purchase, error: pError } = await supabase
        .from('tenant_purchases')
        .insert({
            tenant_id: auth.tenantId,
            work_order_id: workOrderId,
            provider_id: data.provider_id,
            location_id: data.location_id,
            status: 'received',
            total_amount: data.qty * data.cost_unit,
            total_real: data.qty * data.cost_unit,
            reference: data.reference || `Direct Purchase (OS: ${workOrderId.substring(0, 8)})`,
            notes: data.notes,
            created_by: auth.userId,
            purchase_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

    if (pError) {
        console.error('Error creating purchase:', pError);
        return { success: false, error: pError.message };
    }

    // 2. Add line to purchase
    const { error: piError } = await supabase
        .from('tenant_purchase_items')
        .insert({
            purchase_id: purchase.id,
            item_id: data.item_id,
            quantity_ordered: data.qty,
            quantity_received: data.qty,
            unit_cost_estimated: data.cost_unit,
            unit_cost_real: data.cost_unit
        });

    if (piError) {
        console.error('Error adding purchase item:', piError);
        return { success: false, error: piError.message };
    }

    // 3. Trigger inventory IN
    if (data.item_id) {
        const { error: moveError } = await supabase.rpc('api_inventory_in', {
            p_item_id: data.item_id,
            p_location_to_id: data.location_id,
            p_quantity: data.qty,
            p_unit_cost: data.cost_unit,
            p_reference: `Compra Directa (OS: ${workOrderId.substring(0, 8)})`
        });

        if (moveError) {
            console.error('Inventory IN error:', moveError);
        }
    }

    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath('/inventory/purchases');
    return { success: true, data: purchase };
}
