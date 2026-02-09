import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminApi } from '@/lib/auth/guards';

/**
 * POST /api/admin/invite-user
 * 
 * Permite a un Admin invitar a un usuario por email.
 * Requiere Service Role Key para usar Supabase Auth Admin API.
 */
export async function POST(request: NextRequest) {
    try {
        // Validar que el usuario es Admin del tenant activo
        const auth = await requireAdminApi();

        // Parsear body
        const body = await request.json();
        const { email, role_key } = body;

        // Validación de inputs
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email es requerido' },
                { status: 400 }
            );
        }

        if (!role_key || !['Admin', 'Operador', 'Tecnico', 'Lectura'].includes(role_key)) {
            return NextResponse.json(
                { error: 'role_key inválido' },
                { status: 400 }
            );
        }

        // Normalizar email
        const normalizedEmail = email.trim().toLowerCase();

        // Crear cliente de Supabase con credenciales normales para insertar invite
        const supabase = await createClient();

        // VALIDACIÓN 1: Verificar si ya existe una invitación pendiente para este email
        const { data: existingInvites } = await supabase
            .from('tenant_invites')
            .select('id, status')
            .eq('tenant_id', auth.tenantId)
            .eq('email', normalizedEmail)
            .in('status', ['pending'])
            .limit(1);

        if (existingInvites && existingInvites.length > 0) {
            return NextResponse.json(
                {
                    error: 'Ya existe una invitación pendiente para este email',
                    details: 'Elimina o espera que expire la invitación existente antes de crear una nueva'
                },
                { status: 409 } // Conflict
            );
        }

        // VALIDACIÓN 2: Verificar si el usuario ya es miembro del tenant
        // Primero obtener el user_id del email en Supabase Auth
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey) {
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users.users.find(u => u.email?.toLowerCase() === normalizedEmail);

            if (existingUser) {
                // Usuario existe en Auth, verificar si ya es miembro del tenant
                const { data: existingMember } = await supabase
                    .from('tenant_users')
                    .select('id, role_key, is_active')
                    .eq('tenant_id', auth.tenantId)
                    .eq('user_id', existingUser.id)
                    .limit(1);

                if (existingMember && existingMember.length > 0) {
                    const member = existingMember[0];
                    return NextResponse.json(
                        {
                            error: `Este usuario ya es miembro del tenant con rol ${member.role_key}`,
                            details: member.is_active
                                ? 'El usuario está activo en el tenant'
                                : 'El usuario está inactivo - puedes reactivarlo desde la gestión de usuarios'
                        },
                        { status: 409 } // Conflict
                    );
                }
            }
        }

        // Insertar invitación en tenant_invites
        const { data: invite, error: inviteError } = await supabase
            .from('tenant_invites')
            .insert({
                tenant_id: auth.tenantId,
                email: normalizedEmail,
                role_key,
                invited_by: auth.userId,
                status: 'pending',
            })
            .select()
            .single();

        if (inviteError) {
            console.error('Error al crear invitación:', inviteError);
            return NextResponse.json(
                { error: 'Error al crear invitación', details: inviteError.message },
                { status: 500 }
            );
        }


        // Enviar invitación por email usando helper
        const { sendInvitationEmail } = await import('@/lib/invites/send-email');

        let userExists = false;
        try {
            const result = await sendInvitationEmail(normalizedEmail, invite.id);
            userExists = result.userExists;
        } catch (emailError: any) {
            console.error('Error al enviar email de invitación:', emailError);

            // Si falla el envío de email, marcar invite como error pero no fallar completamente
            await supabase
                .from('tenant_invites')
                .update({ status: 'revoked' })
                .eq('id', invite.id);

            return NextResponse.json(
                {
                    error: 'Error al enviar email de invitación',
                    details: emailError.message
                },
                { status: 500 }
            );
        }

        // Determinar método de entrega
        const delivery = userExists ? 'manual_link' : 'email';

        // Generar link de invitación
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invite_link = `${baseUrl}/auth/accept-invite?invite_id=${invite.id}`;

        // Actualizar invitación con delivery method
        await supabase
            .from('tenant_invites')
            .update({ delivery })
            .eq('id', invite.id);

        return NextResponse.json({
            success: true,
            delivery,
            invite_link,
            message: delivery === 'manual_link'
                ? 'Invitación creada. Copia el link y envíaselo al usuario.'
                : 'Invitación enviada por email exitosamente',
            invite: {
                id: invite.id,
                email: invite.email,
                role_key: invite.role_key,
                expires_at: invite.expires_at,
            },
        });

    } catch (error: any) {
        console.error('Error en /api/admin/invite-user:', error);

        // Si es error de autenticación
        if (error.message?.includes('No autenticado')) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Si es error de autorización (no Admin o no tiene tenant)
        if (error.message?.includes('Admin') || error.message?.includes('tenant')) {
            return NextResponse.json(
                { error: error.message },
                { status: 403 }
            );
        }

        return NextResponse.json(
            { error: 'Error interno del servidor', details: error.message },
            { status: 500 }
        );
    }
}
