import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AssetsPage() {
    const auth = await requireAuth()
    const supabase = await createClient()

    const { data: assets, error } = await supabase
        .from('tenant_assets')
        .select(`
            *,
            tenant_clients (
                name
            )
        `)
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false })

    const canCreate = ['Admin', 'Operador', 'Tecnico'].includes(auth.roleKey)

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Activos / Embarcaciones</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {canCreate && (
                        <Link
                            href="/assets/new"
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
                            + Nuevo Activo
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

            {assets && assets.length > 0 ? (
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
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Tipo</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Cliente</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Marca/Modelo</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map((asset) => (
                                <tr key={asset.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{asset.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1976d2',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}>
                                            {asset.asset_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {asset.tenant_clients?.name || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {asset.make && asset.model ? `${asset.make} ${asset.model}` : asset.make || asset.model || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <Link
                                            href={`/assets/${asset.id}`}
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
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>No hay activos registrados</p>
                    {canCreate && (
                        <Link
                            href="/assets/new"
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
                            Crear primer activo
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
