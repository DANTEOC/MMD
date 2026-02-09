'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/guards'

export async function createAssetAction(formData: FormData) {
    const auth = await requireAuth()

    // Validar que sea Admin, Operador o Tecnico
    if (!['Admin', 'Operador', 'Tecnico'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const clientId = formData.get('client_id') as string
    const name = formData.get('name') as string
    const assetType = formData.get('asset_type') as string
    const make = formData.get('make') as string
    const model = formData.get('model') as string
    const year = formData.get('year') as string
    const serial = formData.get('serial') as string
    const notes = formData.get('notes') as string

    if (!clientId || !name || !assetType) {
        throw new Error('Cliente, nombre y tipo son obligatorios')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_assets')
        .insert({
            tenant_id: auth.tenantId,
            client_id: clientId,
            name: name.trim(),
            asset_type: assetType,
            make: make?.trim() || null,
            model: model?.trim() || null,
            year: year ? parseInt(year) : null,
            serial: serial?.trim() || null,
            notes: notes?.trim() || null,
        })

    if (error) {
        console.error('Error creating asset:', error)
        throw new Error(error.message)
    }

    redirect('/assets')
}

export async function updateAssetAction(assetId: string, formData: FormData) {
    const auth = await requireAuth()

    // Validar que sea Admin, Operador o Tecnico
    if (!['Admin', 'Operador', 'Tecnico'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const clientId = formData.get('client_id') as string
    const name = formData.get('name') as string
    const assetType = formData.get('asset_type') as string
    const make = formData.get('make') as string
    const model = formData.get('model') as string
    const year = formData.get('year') as string
    const serial = formData.get('serial') as string
    const notes = formData.get('notes') as string

    if (!clientId || !name || !assetType) {
        throw new Error('Cliente, nombre y tipo son obligatorios')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_assets')
        .update({
            client_id: clientId,
            name: name.trim(),
            asset_type: assetType,
            make: make?.trim() || null,
            model: model?.trim() || null,
            year: year ? parseInt(year) : null,
            serial: serial?.trim() || null,
            notes: notes?.trim() || null,
        })
        .eq('id', assetId)
        .eq('tenant_id', auth.tenantId)

    if (error) {
        console.error('Error updating asset:', error)
        throw new Error(error.message)
    }

    revalidatePath(`/assets/${assetId}`)
    revalidatePath('/assets')
    redirect('/assets')
}

export async function deleteAssetAction(assetId: string) {
    const auth = await requireAuth()

    // Solo Admin puede eliminar
    if (auth.roleKey !== 'Admin') {
        redirect('/forbidden')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_assets')
        .delete()
        .eq('id', assetId)
        .eq('tenant_id', auth.tenantId)

    if (error) {
        console.error('Error deleting asset:', error)
        throw new Error(error.message)
    }

    redirect('/assets')
}
