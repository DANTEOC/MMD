import { logout } from '@/app/actions/auth'
import { requireAuth } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function DashboardPage() {
    const auth = await requireAuth()

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Dashboard</h1>
                <form action={logout}>
                    <button
                        type="submit"
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500
                        }}
                    >
                        Cerrar Sesión
                    </button>
                </form>
            </div>

            <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #ddd'
            }}>
                <h2 style={{ marginTop: 0 }}>Contexto de Autenticación</h2>
                <ul style={{ lineHeight: '1.8' }}>
                    <li><strong>User ID:</strong> <code>{auth.userId}</code></li>
                    <li><strong>Tenant ID:</strong> <code>{auth.tenantId}</code></li>
                    <li><strong>Role:</strong> <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: auth.roleKey === 'Admin' ? '#4caf50' : '#2196f3',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                    }}>{auth.roleKey}</span></li>
                </ul>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                    href="/admin"
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        display: 'inline-block'
                    }}
                >
                    Ir a Admin (solo Admin)
                </Link>

                <Link
                    href="/configuracion"
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#9c27b0',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        display: 'inline-block'
                    }}
                >
                    Ir a Configuración (solo Admin)
                </Link>
            </div>

            <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    <strong>✅ Sesión activa:</strong> Esta página está protegida por <code>requireAuth()</code> en el layout de <code>(app)</code>.
                    Solo usuarios autenticados con tenant activo pueden verla.
                </p>
            </div>
        </div>
    )
}
