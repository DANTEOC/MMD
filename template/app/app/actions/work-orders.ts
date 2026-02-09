'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/guards'

export async function createWorkOrderAction(formData: FormData) {
    const auth = await requireAuth()

    // Validar que sea Admin u Operador
    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const clientId = formData.get('client_id') as string
    const assetId = formData.get('asset_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string || 'open'

    if (!clientId || !title) {
        throw new Error('Cliente y título son obligatorios')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_work_orders')
        .insert({
            tenant_id: auth.tenantId,
            client_id: clientId,
            asset_id: assetId || null,
            title: title.trim(),
            description: description?.trim() || null,
            status: status,
        })

    if (error) {
        console.error('Error creating work order:', error)
        throw new Error(error.message)
    }

    redirect('/work-orders')
}

export async function updateWorkOrderAction(workOrderId: string, formData: FormData) {
    const auth = await requireAuth()
    const supabase = await createClient()

    // Obtener la orden para verificar permisos
    const { data: workOrder } = await supabase
        .from('tenant_work_orders')
        .select('assigned_to')
        .eq('id', workOrderId)
        .eq('tenant_id', auth.tenantId)
        .single()

    // Validar permisos
    const canEdit = ['Admin', 'Operador'].includes(auth.roleKey) ||
        (auth.roleKey === 'Tecnico' && workOrder?.assigned_to === auth.userId)

    if (!canEdit) {
        redirect('/forbidden')
    }

    const clientId = formData.get('client_id') as string
    const assetId = formData.get('asset_id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const assignedTo = formData.get('assigned_to') as string

    if (!clientId || !title) {
        throw new Error('Cliente y título son obligatorios')
    }

    const updateData: any = {
        client_id: clientId,
        asset_id: assetId || null,
        title: title.trim(),
        description: description?.trim() || null,
        status: status,
    }

    // Solo Admin/Operador pueden cambiar asignación
    if (['Admin', 'Operador'].includes(auth.roleKey)) {
        updateData.assigned_to = assignedTo || null
    }

    const { error } = await supabase
        .from('tenant_work_orders')
        .update(updateData)
        .eq('id', workOrderId)
        .eq('tenant_id', auth.tenantId)

    if (error) {
        console.error('Error updating work order:', error)
        throw new Error(error.message)
    }

    revalidatePath(`/work-orders/${workOrderId}`)
    revalidatePath('/work-orders')
    redirect('/work-orders')
}

export async function deleteWorkOrderAction(workOrderId: string) {
    const auth = await requireAuth()

    // Solo Admin puede eliminar
    if (auth.roleKey !== 'Admin') {
        redirect('/forbidden')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_work_orders')
        .delete()
        .eq('id', workOrderId)
        .eq('tenant_id', auth.tenantId)

    if (error) {
        console.error('Error deleting work order:', error)
        throw new Error(error.message)
    }

    redirect('/work-orders')
}
