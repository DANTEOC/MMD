import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Envía una invitación por email usando Supabase Auth Admin API
 * 
 * @param email - Email del usuario a invitar
 * @param inviteId - ID de la invitación creada
 * @returns Resultado de la operación con información sobre si el usuario ya existía
 */
export async function sendInvitationEmail(email: string, inviteId: string): Promise<{ userExists: boolean }> {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // Crear cliente con Service Role
    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // Primero verificar si el usuario ya existe
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        throw new Error(`Error al verificar usuarios: ${listError.message}`);
    }

    const userExists = existingUsers.users.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (userExists) {
        // Usuario ya existe - no podemos usar inviteUserByEmail
        console.log(`[INVITACIÓN] Usuario ${email} ya existe en Supabase Auth - NO se envía email`);
        return { userExists: true };
    }

    // Usuario no existe - enviar invitación normal
    console.log(`[INVITACIÓN] Usuario ${email} NO existe - enviando email de invitación...`);

    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?invite_id=${inviteId}`
        : `http://localhost:3000/auth/accept-invite?invite_id=${inviteId}`;

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
            redirectTo: redirectUrl,
        }
    );

    if (error) {
        console.error(`[INVITACIÓN] Error al enviar email a ${email}:`, error);
        throw new Error(`Error al enviar email: ${error.message}`);
    }

    console.log(`[INVITACIÓN] Email enviado exitosamente a ${email}`);
    return { userExists: false };
}
