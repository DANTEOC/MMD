'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/guards';

export type CatalogItem = {
    id: string;
    kind: 'PRODUCT' | 'SERVICE';
    name: string;
    description: string | null;
    unit: string;
    base_cost: number;
    sale_price: number;
    is_stockable: boolean;
};

export type InventoryLocation = {
    id: string;
    name: string;
    type: string;
};

/**
 * Get active catalog items
 */
export async function getCatalogItems(kind?: 'PRODUCT' | 'SERVICE'): Promise<CatalogItem[]> {
    const auth = await requireAuth();
    const supabase = await createClient();

    let query = supabase
        .from('tenant_catalog_items')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .eq('is_active', true)
        .order('name');

    if (kind) {
        query = query.eq('kind', kind);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching catalog items:', error);
        return [];
    }

    return data || [];
}

/**
 * Get active inventory locations
 */
export async function getInventoryLocations(): Promise<InventoryLocation[]> {
    const auth = await requireAuth();
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tenant_inventory_locations')
        .select('id, name, type')
        .eq('tenant_id', auth.tenantId)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching locations:', error);
        return [];
    }

    return data || [];
}
