'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { revalidatePath } from 'next/cache';

/**
 * Revocar una invitación (cambiar status a 'revoked')
 */
export async function deleteInvite(inviteId: string) {
    try {
        const auth = await requireAdmin();
        const supabase = await createClient();

        // Actualizar status a 'revoked' (no eliminar físicamente)
        const { error } = await supabase
            .from('tenant_invites')
            .update({ status: 'revoked' })
            .eq('id', inviteId)
            .eq('tenant_id', auth.tenantId); // Seguridad: solo invites del tenant

        if (error) {
            console.error('Error al revocar invitación:', error);
            return { success: false, error: 'Error al revocar invitación' };
        }

        // Revalidar la página para mostrar cambios
        revalidatePath('/admin/users');

        return { success: true };
    } catch (error: any) {
        console.error('Error en deleteInvite:', error);
        return { success: false, error: error.message || 'Error desconocido' };
    }
}

/**
 * Re-enviar una invitación
 */
export async function resendInvite(inviteId: string) {
    try {
        const auth = await requireAdmin();
        const supabase = await createClient();

        // Obtener la invitación
        const { data: invite, error: fetchError } = await supabase
            .from('tenant_invites')
            .select('*')
            .eq('id', inviteId)
            .eq('tenant_id', auth.tenantId)
            .single();

        if (fetchError || !invite) {
            return { success: false, error: 'Invitación no encontrada' };
        }

        // Verificar que no esté ya aceptada
        if (invite.status === 'accepted') {
            return { success: false, error: 'Esta invitación ya fue aceptada' };
        }

        // Revocar la invitación anterior
        await supabase
            .from('tenant_invites')
            .update({ status: 'revoked' })
            .eq('id', inviteId);

        // Crear nueva invitación
        const { data: newInvite, error: createError } = await supabase
            .from('tenant_invites')
            .insert({
                tenant_id: auth.tenantId,
                email: invite.email,
                role_key: invite.role_key,
                invited_by: auth.userId,
                status: 'pending',
            })
            .select()
            .single();

        if (createError || !newInvite) {
            console.error('Error al crear nueva invitación:', createError);
            return { success: false, error: 'Error al crear nueva invitación' };
        }

        // Importar helper para enviar email
        const { sendInvitationEmail } = await import('@/lib/invites/send-email');

        // Enviar email de invitación con el ID de la nueva invitación
        let userExists = false;
        try {
            const result = await sendInvitationEmail(invite.email, newInvite.id);
            userExists = result.userExists;
        } catch (emailError: any) {
            console.error('Error al enviar email:', emailError);
            // No fallar completamente - la invitación ya fue creada
            // Solo informar que el email no se pudo enviar
        }

        // Determinar método de entrega para actualizar la BD
        const delivery = userExists ? 'manual_link' : 'email';

        await supabase
            .from('tenant_invites')
            .update({ delivery })
            .eq('id', newInvite.id);

        // Revalidar la página para mostrar cambios
        revalidatePath('/admin/users');

        // Retornar mensaje apropiado
        if (delivery === 'manual_link') {
            return {
                success: true,
                message: 'Invitación creada. El usuario ya tiene cuenta - copia el link y envíaselo manualmente.'
            };
        }

        return { success: true, message: 'Invitación re-enviada por email exitosamente' };
    } catch (error: any) {
        console.error('Error en resendInvite:', error);
        return { success: false, error: error.message || 'Error desconocido' };
    }
}
