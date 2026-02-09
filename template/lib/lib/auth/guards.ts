import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuthContext, TenantUser } from './types'

export async function requireAuth(): Promise<AuthContext> {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        redirect('/login')
    }

    const userId = user.id

    const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('user_id, tenant_id, role_key, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(2)
        .returns<TenantUser[]>()

    if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        redirect('/no-autorizado')
    }

    if (tenantUsers.length > 1) {
        // No debería pasar por el índice parcial, pero si pasa, bloqueamos
        redirect('/no-autorizado')
    }

    const tu = tenantUsers[0]

    return {
        userId: tu.user_id,
        tenantId: tu.tenant_id,
        roleKey: tu.role_key,
    }
}

export async function requireAdmin(): Promise<AuthContext> {
    const ctx = await requireAuth()
    if (ctx.roleKey !== 'Admin') {
        redirect('/forbidden')
    }
    return ctx
}

// Versiones para API Routes que lanzan errores en lugar de redirect
export async function requireAuthApi(): Promise<AuthContext> {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        throw new Error('No autenticado')
    }

    const userId = user.id

    const { data: tenantUsers, error: tenantError } = await supabase
        .from('tenant_users')
        .select('user_id, tenant_id, role_key, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(2)
        .returns<TenantUser[]>()

    if (tenantError || !tenantUsers || tenantUsers.length === 0) {
        throw new Error('Usuario no tiene tenant activo')
    }

    if (tenantUsers.length > 1) {
        throw new Error('Usuario tiene múltiples tenants activos')
    }

    const tu = tenantUsers[0]

    return {
        userId: tu.user_id,
        tenantId: tu.tenant_id,
        roleKey: tu.role_key,
    }
}

export async function requireAdminApi(): Promise<AuthContext> {
    const ctx = await requireAuthApi()
    if (ctx.roleKey !== 'Admin') {
        throw new Error('Se requiere rol Admin')
    }
    return ctx
}
