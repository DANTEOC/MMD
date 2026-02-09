import Link from 'next/link'

export default function ForbiddenPage() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui',
            backgroundColor: '#fafafa'
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⛔</div>
                <h1 style={{ color: '#c62828', marginBottom: '1rem' }}>Acceso Prohibido</h1>
                <p style={{ marginTop: '1rem', color: '#666', lineHeight: '1.6' }}>
                    Tu rol no tiene permisos suficientes para acceder a esta página.
                </p>

                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#ffebee',
                    borderRadius: '4px',
                    border: '1px solid #ef5350'
                }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#c62828' }}>
                        Requisitos no cumplidos:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#c62828', lineHeight: '1.8' }}>
                        <li>Esta página requiere rol <strong>Admin</strong></li>
                        <li>Tu rol actual no tiene permisos suficientes</li>
                    </ul>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1565c0' }}>
                        💡 <strong>Sugerencia:</strong> Contacta a un administrador si crees que deberías tener acceso a esta página.
                    </p>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
                        Ir al Dashboard
                    </Link>
                    <Link
                        href="/"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#666',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            display: 'inline-block'
                        }}
                    >
                        Ir al Inicio
                    </Link>
                </div>
            </div>
        </div>
    )
}
