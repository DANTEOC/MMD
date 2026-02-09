import { requireAdmin } from '@/lib/auth/guards'
import Link from 'next/link'

export default async function AdminPage() {
    const auth = await requireAdmin()

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Panel de Administración</h1>

            <div style={{
                marginTop: '2rem',
                padding: '1.5rem',
                backgroundColor: '#fff3e0',
                borderRadius: '8px',
                border: '2px solid #ff9800'
            }}>
                <h2 style={{ marginTop: 0, color: '#e65100' }}>⚠️ Área Restringida</h2>
                <p>Solo usuarios con rol <strong>Admin</strong> pueden acceder a esta página.</p>

                <div style={{ marginTop: '1.5rem' }}>
                    <h3>Tu contexto:</h3>
                    <ul style={{ lineHeight: '1.8' }}>
                        <li><strong>User ID:</strong> <code>{auth.userId}</code></li>
                        <li><strong>Tenant ID:</strong> <code>{auth.tenantId}</code></li>
                        <li><strong>Role:</strong> <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}>{auth.roleKey}</span></li>
                    </ul>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Link
                    href="/dashboard"
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        display: 'inline-block'
                    }}
                >
                    ← Volver al Dashboard
                </Link>
            </div>

            <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#e8f5e9', borderRadius: '4px', border: '1px solid #4caf50' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    <strong>Protección:</strong> Esta página usa <code>requireAdmin()</code> que valida:
                </p>
                <ul style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                    <li>Usuario autenticado</li>
                    <li>Tenant activo</li>
                    <li>Rol = Admin</li>
                </ul>
            </div>
        </div>
    )
}
