export default function HomePage() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h1>MMD Maintenance</h1>
                <p>Sistema ERP/CRM Multi-tenant</p>
                <div style={{ marginTop: '2rem' }}>
                    <a
                        href="/configuracion"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            marginRight: '1rem'
                        }}
                    >
                        Ir a Configuración (requiere Admin)
                    </a>
                    <a
                        href="/login"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#666',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        Login
                    </a>
                </div>
            </div>
        </div>
    )
}
