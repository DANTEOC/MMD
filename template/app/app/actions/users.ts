'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'

export async function addOrUpdateMembership(formData: FormData) {
    try {
        // Verificar que es Admin
        const auth = await requireAdmin()

        const userId = formData.get('user_id') as string
        const roleKey = formData.get('role_key') as string
        const isActive = formData.get('is_active') === 'true'

        console.log('Adding membership:', { userId, roleKey, isActive, tenantId: auth.tenantId })

        // Validar inputs
        if (!userId || !roleKey) {
            return { error: 'user_id y role_key son obligatorios' }
        }

        // Validar formato UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(userId)) {
            return { error: 'user_id debe ser un UUID válido' }
        }

        // Validar que el roleKey sea válido
        const validRoles = ['Admin', 'Operador', 'Tecnico', 'Lectura']
        if (!validRoles.includes(roleKey)) {
            return { error: 'role_key inválido' }
        }

        const supabase = await createClient()

        // Insertar o actualizar membership
        const { data, error } = await supabase
            .from('tenant_users')
            .upsert({
                tenant_id: auth.tenantId,
                user_id: userId,
                role_key: roleKey,
                is_active: isActive,
            }, {
                onConflict: 'tenant_id,user_id'
            })
            .select()

        if (error) {
            console.error('Error inserting membership:', error)
            return { error: error.message }
        }

        console.log('Membership added successfully:', data)

        revalidatePath('/admin/users')
        return { success: true, message: 'Usuario agregado/actualizado correctamente' }
    } catch (error: any) {
        console.error('Unexpected error:', error)
        return { error: error.message || 'Error inesperado' }
    }
}
