import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientsPage() {
    const auth = await requireAuth()
    const supabase = await createClient()

    const { data: clients, error } = await supabase
        .from('tenant_clients')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    const canCreate = ['Admin', 'Operador'].includes(auth.roleKey)

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Clientes</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {canCreate && (
                        <Link
                            href="/clients/new"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            + Nuevo Cliente
                        </Link>
                    )}
                    <Link
                        href="/dashboard"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#666',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}
                    >
                        ← Dashboard
                    </Link>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '2rem' }}>
                    Error: {error.message}
                </div>
            )}

            {clients && clients.length > 0 ? (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Nombre</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Teléfono</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Creado</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map((client) => (
                                <tr key={client.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{client.name}</td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {client.email || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {client.phone || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {new Date(client.created_at).toLocaleDateString('es-MX')}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <Link
                                            href={`/clients/${client.id}`}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#2196f3',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500
                                            }}
                                        >
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>No hay clientes registrados</p>
                    {canCreate && (
                        <Link
                            href="/clients/new"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                display: 'inline-block'
                            }}
                        >
                            Crear primer cliente
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
