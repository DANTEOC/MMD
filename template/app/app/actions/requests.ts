'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Obtener lista de tenants disponibles para solicitud
 * Nota: En un entorno real, esto debería estar filtrado o paginado.
 */
export async function getAvailableTenants() {
    const supabase = await createClient();

    // Usamos select básico. Si RLS bloquea, necesitaremos exponer una vista pública o usar admin client
    // Para MVP asumimos que los usuarios autenticados pueden ver la lista básica de tenants (nombre, id)
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name');

    if (error) {
        console.error('Error fetching tenants:', error);
        return [];
    }

    return data || [];
}

/**
 * Crear una solicitud de acceso
 */
export async function createJoinRequest(tenantId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Usuario no autenticado' };
    }

    try {
        const { error } = await supabase
            .from('tenant_join_requests')
            .insert({
                tenant_id: tenantId,
                user_id: user.id,
                status: 'pending'
            });

        if (error) {
            // Manejar error de duplicados (UNIQUE constraint)
            if (error.code === '23505') {
                return { success: false, error: 'Ya tienes una solicitud pendiente o activa para este tenant' };
            }
            console.error('Error creating request:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/pending');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener estado de las solicitudes del usuario
 */
export async function getUserRequests() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('tenant_join_requests')
        .select(`
            id,
            status,
            created_at,
            decided_at,
            tenants (
                id,
                name
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting user requests:', error);
        return [];
    }

    return data || [];
}

/**
 * Decidir sobre una solicitud (Aprobar/Rechazar)
 */
export async function decideJoinRequest(requestId: string, decision: 'approved' | 'rejected', roleKey: string = 'Lectura') {
    const supabase = await createClient();

    try {
        // Llamar al RPC
        const { data, error } = await supabase
            .rpc('api_join_request_decide', {
                p_request_id: requestId,
                p_decision: decision,
                p_role_key: roleKey
            });

        if (error) {
            console.error('Error deciding request:', error);
            // Si el error es de DB, intentar extraer mensaje útil
            return { success: false, error: error.message };
        }

        /* 
           Nota: Postgres function returns TABLE so it comes as array of objects
        */
        const result = Array.isArray(data) ? data[0] : data;

        if (!result) {
            // Fallback si no hay data pero no hubo error
            return { success: true, message: 'Operación completada' };
        }

        if (!result.success) {
            return { success: false, error: result.message || 'Error desconocido' };
        }

        revalidatePath('/admin/requests');
        return { success: true, message: result.message };
    } catch (error: any) {
        console.error('Error in decideJoinRequest:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener solicitudes pendientes del tenant activo (Solo Admin)
 */
export async function getTenantRequests(tenantId: string) {
    const supabase = await createClient();

    // RLS garantiza que solo se vean las del tenant si soy admin
    const { data, error } = await supabase
        .from('tenant_join_requests')
        .select(`
            id,
            user_id,
            status,
            created_at,
            /* Obtenemos metadata del usuario desde Auth users is tricky in Supabase standard client 
               if we don't have a public profile table. 
               Usualmente necesitamos un join con una tabla de perfiles pública.
               Si no existe, solo tendremos el user_id. 
               Para este caso, mostraremos el ID o email si es posible. 
               El email está en auth.users, no accesible directamente por foreign key estándar sin config extra.
               
               Workaround: Obtener lista y luego buscar emails si tengo permisos de admin auth (service role).
               O idealmente tener tabla 'users' pública.
               
               Si no tenemos tabla users pública, mostraremos solo User ID por ahora.
            */
            user_id
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tenant requests:', error);
        return [];
    }

    // Intentar enriquecer con emails usando admin client si es necesario, 
    // pero por ahora devolvemos lo que hay.
    // Si queremos el email, necesitamos auth admin.

    return data || [];
}
