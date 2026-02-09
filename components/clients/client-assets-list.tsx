
import Link from 'next/link'

interface Asset {
    id: string
    name: string
    asset_type: string
    model: string | null
    serial: string | null
    created_at: string
}

interface ClientAssetsListProps {
    clientId: string
    assets: Asset[]
}

export function ClientAssetsList({ clientId, assets }: ClientAssetsListProps) {
    if (assets.length === 0) {
        return (
            <div style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px dashed #ccc'
            }}>
                <p style={{ color: '#666', marginBottom: '1rem' }}>Este cliente no tiene activos registrados.</p>
                <Link
                    href={`/assets/new?client_id=${clientId}`}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 500
                    }}
                >
                    + Crear Primer Activo
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                    href={`/assets/new?client_id=${clientId}`}
                    style={{
                        padding: '0.5rem 1rem',
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
            </div>

            <div style={{
                overflow: 'hidden',
                border: '1px solid #eee',
                borderRadius: '8px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Nombre</th>
                            <th style={{ padding: '0.75rem' }}>Tipo</th>
                            <th style={{ padding: '0.75rem' }}>Modelo</th>
                            <th style={{ padding: '0.75rem' }}>Serie</th>
                            <th style={{ padding: '0.75rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map((asset) => (
                            <tr key={asset.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{asset.name}</td>
                                <td style={{ padding: '0.75rem' }}>{asset.asset_type}</td>
                                <td style={{ padding: '0.75rem', color: '#666' }}>{asset.model || '-'}</td>
                                <td style={{ padding: '0.75rem', color: '#666' }}>{asset.serial || '-'}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <Link
                                        href={`/assets/${asset.id}`}
                                        style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 500 }}
                                    >
                                        Ver
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
