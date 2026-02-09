/**
 * Roles disponibles en el sistema MMD Maintenance
 */
export type RoleKey = 'Admin' | 'Operador' | 'Tecnico' | 'Lectura' | 'Supervisor' | 'Contador' | 'Visitante'

/**
 * Contexto de autenticación del usuario
 * Retornado por requireAuth() y requireAdmin()
 */
export interface AuthContext {
    userId: string
    tenantId: string
    roleKey: RoleKey
}

/**
 * Registro de tenant_users en la base de datos
 */
export interface TenantUser {
    user_id: string
    tenant_id: string
    role_key: RoleKey
    is_active: boolean
}
