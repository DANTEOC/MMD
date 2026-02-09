import Link from 'next/link'

export default function NoAutorizadoPage() {
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
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
                <h1 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Acceso No Autorizado</h1>
                <p style={{ marginTop: '1rem', color: '#666', lineHeight: '1.6' }}>
                    No tienes permisos para acceder a este recurso.
                </p>

                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    textAlign: 'left'
                }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#856404' }}>
                        Posibles causas:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#856404', lineHeight: '1.8' }}>
                        <li>No tienes un tenant activo asignado</li>
                        <li>Tu cuenta tiene múltiples tenants activos (error de configuración)</li>
                        <li>Las políticas RLS bloquearon el acceso</li>
                        <li>Tu membresía fue desactivada</li>
                    </ul>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link
                        href="/login"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            display: 'inline-block'
                        }}
                    >
                        Ir a Login
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
