import { requireAdmin } from '@/lib/auth'

/**
 * Página de configuración (solo Admin)
 * Ejemplo de uso de requireAdmin()
 */
export default async function ConfiguracionPage() {
    // Guard: solo usuarios con rol Admin pueden acceder
    const authContext = await requireAdmin()

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
            <h1>Configuración del Sistema</h1>
            <p>Solo usuarios con rol <strong>Admin</strong> pueden ver esta página.</p>

            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px'
            }}>
                <h2>Contexto de Autenticación:</h2>
                <ul>
                    <li><strong>User ID:</strong> {authContext.userId}</li>
                    <li><strong>Tenant ID:</strong> {authContext.tenantId}</li>
                    <li><strong>Role:</strong> {authContext.roleKey}</li>
                </ul>
            </div>

            <p style={{ marginTop: '2rem', color: '#666' }}>
                <em>Placeholder: aquí irá la UI de configuración del sistema.</em>
            </p>
        </div>
    )
}
