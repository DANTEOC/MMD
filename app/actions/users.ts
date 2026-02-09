'use server'

import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/guards'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch all users for the tenant (Active & Suspended)
 * Visible to: Admin, Supervisor.
 */
export async function getTenantUsers() {
    noStore();
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return []; // Or throw, but returning empty list is safe for UI
    }

    const supabase = await createClient();

    // 1. Fetch tenant users
    const { data: tenantUsers, error: usersError } = await supabase
        .from('tenant_users')
        .select('user_id, role_key, is_active')
        .eq('tenant_id', auth.tenantId)
        .order('role_key');

    if (usersError) {
        console.error('Error fetching tenant users:', usersError);
        return [];
    }

    if (!tenantUsers || tenantUsers.length === 0) {
        return [];
    }

    // 2. Fetch profiles for these users
    const userIds = tenantUsers.map(u => u.user_id);
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]));

    return tenantUsers.map(u => ({
        user_id: u.user_id,
        role_key: u.role_key,
        is_active: u.is_active,
        profile: profilesMap.get(u.user_id) || { email: 'Unknown', full_name: 'Unknown' }
    }));
}

/**
 * Create a new user (Direct CRUD)
 * Only Admin/Supervisor can create users.
 */
export async function createUser(data: { email: string, full_name: string, password: string, role_key: string }) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return { error: 'No autorizado' };
    }

    // Validate Supervisor limitations
    if (auth.roleKey === 'Supervisor' && data.role_key === 'Admin') {
        return { error: 'Supervisores no pueden crear Administradores' };
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return { error: 'Error de configuración del servidor (Service Key missing)' };
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Create User in Auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: {
            full_name: data.full_name
        }
    });

    if (createError) {
        return { error: createError.message };
    }

    if (!userData.user) {
        return { error: 'Error desconocido al crear usuario' };
    }

    const userId = userData.user.id;
    const supabase = await createClient(); // Use regular client for RLS context if needed, but for inserting tenant_user we use standard client

    // 2. Add to tenant_users
    // Note: We need to ensure we insert with the current tenant context.
    const { error: tenantError } = await supabase
        .from('tenant_users')
        .insert({
            tenant_id: auth.tenantId,
            user_id: userId,
            role_key: data.role_key,
            is_active: true
        });

    if (tenantError) {
        // Rollback? Deleting user from Auth is tricky without more complex logic. 
        // For MVP, if this fails, we have an orphan user. admin can delete it manually or we try to clean up.
        // Let's try to cleanup
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return { error: 'Error al asignar usuario al tenant: ' + tenantError.message };
    }

    revalidatePath('/admin/users');
    return { success: true, userId };
}

/**
 * Reset User Password
 * Only Admin/Supervisor can reset passwords.
 */
export async function resetUserPassword(userId: string, newPassword: string) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return { error: 'No autorizado' };
    }

    // Validate self-reset? Usually allowed or handled via normal flow, but admin override is fine.

    // Validate target role (Supervisor cannot reset Admin)
    const supabase = await createClient();
    if (auth.roleKey === 'Supervisor') {
        const { data: target } = await supabase.from('tenant_users').select('role_key').eq('user_id', userId).eq('tenant_id', auth.tenantId).single();
        if (target && target.role_key === 'Admin') {
            return { error: 'No puedes cambiar la contraseña de un Administrador' };
        }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return { error: 'Error de configuración del servidor' };
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (updateError) {
        return { error: updateError.message };
    }

    // Optional: Logout user from all devices?
    await supabaseAdmin.auth.admin.signOut(userId);

    return { success: true, message: 'Contraseña actualizada correctamente' };
}


/**
 * Toggle User Status (Suspend/Activate)
 */
export async function toggleUserStatus(userId: string, isActive: boolean) {
    const auth = await requireAuth();
    if (!['Admin', 'Supervisor'].includes(auth.roleKey)) {
        return { error: 'No autorizado' };
    }

    // Self-suspension check
    if (userId === auth.userId) {
        return { error: 'No puedes suspender tu propia cuenta' };
    }

    const supabase = await createClient();

    // Supervisor cannot suspend Admin?
    if (auth.roleKey === 'Supervisor') {
        const { data: target } = await supabase.from('tenant_users').select('role_key').eq('user_id', userId).eq('tenant_id', auth.tenantId).single();
        if (target && target.role_key === 'Admin') {
            return { error: 'Acción no permitida sobre Administradores' };
        }
    }

    const { error } = await supabase
        .from('tenant_users')
        .update({ is_active: isActive })
        .eq('user_id', userId)
        .eq('tenant_id', auth.tenantId);

    if (error) return { error: error.message };

    console.log(`[AUDIT] User ${auth.userId} changed status of ${userId} to ${isActive}`);

    revalidatePath('/admin/users');
    return { success: true };
}
