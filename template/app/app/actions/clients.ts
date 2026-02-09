'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/guards'

type ClientFormData = {
    name: string
    email?: string
    phone?: string
    notes?: string
}

export async function createClientAction(formData: FormData) {
    const auth = await requireAuth()

    // Validar que sea Admin u Operador
    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const notes = formData.get('notes') as string

    if (!name || name.trim() === '') {
        throw new Error('El nombre es obligatorio')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_clients')
        .insert({
            tenant_id: auth.tenantId,
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            notes: notes?.trim() || null,
        })

    if (error) {
        console.error('Error creating client:', error)
        throw new Error(error.message)
    }

    redirect('/clients')
}

export async function updateClient(clientId: string, formData: FormData) {
    const auth = await requireAuth()

    // Validar que sea Admin u Operador
    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const notes = formData.get('notes') as string

    if (!name || name.trim() === '') {
        throw new Error('El nombre es obligatorio')
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_clients')
        .update({
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            notes: notes?.trim() || null,
        })
        .eq('id', clientId)
        .eq('tenant_id', auth.tenantId)

    if (error) {
        console.error('Error updating client:', error)
        throw new Error(error.message)
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath('/clients')
    redirect('/clients')
}

export async function deleteClient(clientId: string) {
    const auth = await requireAuth()

    // Solo Admin puede eliminar
    if (auth.roleKey !== 'Admin') {
        return { error: 'Solo Admin puede eliminar clientes' }
    }

    const supabase = await createClient()

    const { error } = await supabase
        .from('tenant_clients')
        .delete()
        .eq('id', clientId)
        .eq('tenant_id', auth.tenantId)

    if (error) {
        console.error('Error deleting client:', error)
        return { error: error.message }
    }

    redirect('/clients')
}
