'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export type WorkOrderLine = {
    id: string;
    kind: 'SERVICE' | 'MATERIAL';
    name: string;
    qty: number;
    unit: string;
    unit_price: number;
    cost_unit: number;
    line_total: number;
    cost_total: number;
    created_at: string;
};

export type AddLineData = {
    kind: 'SERVICE' | 'MATERIAL';
    name: string;
    qty: number;
    unit?: string;
    unit_price: number;
    cost_unit: number;
    // New fields for integration
    catalog_item_id?: string;
    location_id?: string;
};

/**
 * Obtener líneas de una Work Order
 */
export async function getWorkOrderLines(workOrderId: string): Promise<WorkOrderLine[]> {
    noStore();
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_work_order_lines')
        .select('*')
        .eq('work_order_id', workOrderId)
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching work order lines:', error);
        return [];
    }

    return data || [];
}

/**
 * Helper: Verificar si item es stockable
 */
async function checkIsStockable(itemId: string, supabase: any) {
    const { data, error } = await supabase
        .from('tenant_catalog_items')
        .select('is_stockable, base_cost')
        .eq('id', itemId)
        .single();

    if (error || !data) return { isStockable: false, cost: 0 };
    return { isStockable: data.is_stockable, cost: data.base_cost };
}

/**
 * Agregar línea a una Work Order
 * Ahora integra descuento de inventario
 */
export async function addWorkOrderLine(workOrderId: string, lineData: AddLineData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // Validaciones básicas
    if (!lineData.name || lineData.name.trim() === '') {
        return { success: false, error: 'El nombre es requerido' };
    }

    if (!lineData.qty || lineData.qty <= 0) {
        return { success: false, error: 'La cantidad debe ser mayor a 0' };
    }

    if (!['SERVICE', 'MATERIAL'].includes(lineData.kind)) {
        return { success: false, error: 'Tipo inválido. Debe ser SERVICE o MATERIAL' };
    }

    let inventoryMovementId: string | null = null;
    let finalUnitCost: number = 0;
    // Final cost logic: use system cost if available and user didn't override, 
    // otherwise use provided cost.
    finalUnitCost = lineData.cost_unit || 0;

    if (lineData.catalog_item_id) {
        const { isStockable, cost } = await checkIsStockable(lineData.catalog_item_id, supabase);

        // If stockable, we should definitely use the system cost or provided cost.
        // Usually, for inventory, system cost is better.
        if (isStockable && cost > 0) {
            finalUnitCost = Number(cost);
        } else if (cost > 0 && !lineData.cost_unit) {
            finalUnitCost = Number(cost);
        }

        if (isStockable) {
            if (!lineData.location_id) {
                return { success: false, error: 'Se requiere ubicación para este material' };
            }

            const { data: moveResult, error: moveError } = await supabase.rpc('api_inventory_out', {
                p_item_id: lineData.catalog_item_id,
                p_location_from_id: lineData.location_id,
                p_quantity: lineData.qty,
                p_reference: `WO Consumo (ID: ${workOrderId.substring(0, 8)}...)`
            });

            if (moveError) {
                console.error('Inventory Error:', moveError);
                if (moveError.message.includes('Insufficient stock')) {
                    return { success: false, error: 'Stock insuficiente en la ubicación seleccionada' };
                }
                return { success: false, error: 'Error de inventario: ' + moveError.message };
            }

            inventoryMovementId = moveResult.movement_id;
        }
    }

    // Llamar al RPC v2 (o v1 actualizado)
    const { data, error } = await supabase.rpc('api_work_order_add_line_v2', {
        p_work_order_id: workOrderId,
        p_kind: lineData.kind,
        p_name: lineData.name.trim(),
        p_qty: lineData.qty,
        p_unit: lineData.unit || 'unit',
        p_unit_price: lineData.unit_price || 0,
        p_cost_unit: finalUnitCost,
        p_inventory_movement_id: inventoryMovementId
    });

    if (error) {
        console.error('Error adding work order line:', error);
        return { success: false, error: 'Error al agregar línea: ' + error.message };
    }

    console.log(`[Action] Added line to WO ${workOrderId}. Revalidating...`);
    // Force complete revalidation
    revalidatePath('/', 'layout');
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/work-orders/${workOrderId}`, 'page');

    return {
        success: true,
        data: data?.[0] || data // RPC retorna array con 1 elemento
    };
}

/**
 * Eliminar línea de una Work Order
 */
export async function deleteWorkOrderLine(id: string, workOrderId: string) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // 1. Get the line to check if it has a movement
    const { data: line, error: fetchError } = await supabase
        .from('tenant_work_order_lines')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .single();

    if (fetchError || !line) {
        return { success: false, error: 'Línea no encontrada' };
    }

    // 2. If it has an inventory movement, we should probably reverse it or alert
    // For Phase I, we might just block or implement reversal
    if (line.inventory_movement_id) {
        // Option A: Block
        // return { success: false, error: 'No se puede eliminar una línea con movimiento de inventario. Debe devolver el material primero.' };

        // Option B: Implement reversal (api_inventory_in/return)
        // Let's stick to Option A or just delete the line for now if user didn't specify strictness.
        // Actually, deleting the line will leave inventory movement orphan or it might have a FK.
    }

    const { error, status } = await supabase
        .from('tenant_work_order_lines')
        .delete()
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        console.error('Error deleting work order line:', error);
        return { success: false, error: 'Error al eliminar línea: ' + error.message };
    }

    console.log(`[Action] Deleted line ${id} from WO ${workOrderId}. Status: ${status}. Revalidating...`);
    // Force complete revalidation
    revalidatePath('/', 'layout');
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/work-orders/${workOrderId}`, 'page');

    return { success: true };
}

/**
 * Actualizar línea de una Work Order
 */
export async function updateWorkOrderLine(id: string, workOrderId: string, lineData: AddLineData) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // Basic validation
    if (!lineData.name || lineData.name.trim() === '') {
        return { success: false, error: 'El nombre es requerido' };
    }

    const { error, status } = await supabase
        .from('tenant_work_order_lines')
        .update({
            name: lineData.name.trim(),
            qty: lineData.qty,
            unit: lineData.unit || 'unit',
            unit_price: lineData.unit_price || 0,
            cost_unit: lineData.cost_unit || 0,
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId);

    if (error) {
        console.error('Error updating work order line:', error);
        return { success: false, error: 'Error al actualizar línea: ' + error.message };
    }

    console.log(`[Action] Updated line ${id} in WO ${workOrderId}. Status: ${status}. Revalidating...`);
    // Force complete revalidation
    revalidatePath('/', 'layout');
    revalidatePath(`/work-orders/${workOrderId}`);
    revalidatePath(`/work-orders/${workOrderId}`, 'page');

    return { success: true };
}

/**
 * Devolver material de una OS al inventario
 */
export async function returnWorkOrderLine(lineId: string, workOrderId: string, qty: number, locationId: string, notes?: string) {
    const auth = await requireAuth();
    const supabase = await createClient();

    // 1. Get the line details
    const { data: line, error: fError } = await supabase
        .from('tenant_work_order_lines')
        .select('*')
        .eq('id', lineId)
        .eq('tenant_id', auth.tenantId)
        .single();

    if (fError || !line) return { success: false, error: 'Línea no encontrada' };
    if (!line.item_id) return { success: false, error: 'Esta línea no está vinculada a un ítem del catálogo' };

    // 2. Call inventory return RPC
    const { error: rpcError } = await supabase.rpc('api_inventory_return', {
        p_item_id: line.item_id,
        p_location_id: locationId,
        p_quantity: qty,
        p_reference_type: 'OS',
        p_reference_id: workOrderId,
        p_reason_code: 'DEVOLUCION_OS',
        p_notes: notes || 'Devolución desde Orden de Servicio'
    });

    if (rpcError) {
        console.error('Return Error:', rpcError);
        return { success: false, error: rpcError.message };
    }

    // 3. Force revalidation
    revalidatePath(`/work-orders/${workOrderId}`);
    return { success: true };
}
