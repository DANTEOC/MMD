import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { updateAssetAction } from '@/app/actions/assets'
import { DeleteAssetButton } from './DeleteAssetButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AssetDetailPage({ params }: { params: { id: string } }) {
    const auth = await requireAuth()
    const supabase = await createClient()

    const { data: asset, error } = await supabase
        .from('tenant_assets')
        .select(`
            *,
            tenant_clients (
                id,
                name
            )
        `)
        .eq('id', params.id)
        .eq('tenant_id', auth.tenantId)
        .single()

    if (error || !asset) {
        notFound()
    }

    // Obtener lista de clientes para el select
    const { data: clients } = await supabase
        .from('tenant_clients')
        .select('id, name')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    const canEdit = ['Admin', 'Operador', 'Tecnico'].includes(auth.roleKey)
    const canDelete = auth.roleKey === 'Admin'

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/assets"
                    style={{ color: '#2196f3', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Volver a Activos
                </Link>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginTop: 0 }}>
                    {canEdit ? 'Editar Activo' : 'Detalle de Activo'}
                </h1>

                <form action={updateAssetAction.bind(null, asset.id)}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="client_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Cliente <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            id="client_id"
                            name="client_id"
                            required
                            defaultValue={asset.client_id}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        >
                            {clients?.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Nombre <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            defaultValue={asset.name}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="asset_type" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Tipo <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            id="asset_type"
                            name="asset_type"
                            required
                            defaultValue={asset.asset_type}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        >
                            <option value="boat">Embarcación</option>
                            <option value="engine">Motor</option>
                            <option value="equipment">Equipo</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label htmlFor="make" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Marca
                            </label>
                            <input
                                id="make"
                                name="make"
                                type="text"
                                defaultValue={asset.make || ''}
                                disabled={!canEdit}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box',
                                    backgroundColor: canEdit ? 'white' : '#f5f5f5'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="model" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Modelo
                            </label>
                            <input
                                id="model"
                                name="model"
                                type="text"
                                defaultValue={asset.model || ''}
                                disabled={!canEdit}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box',
                                    backgroundColor: canEdit ? 'white' : '#f5f5f5'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label htmlFor="year" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Año
                            </label>
                            <input
                                id="year"
                                name="year"
                                type="number"
                                min="1900"
                                max="2100"
                                defaultValue={asset.year || ''}
                                disabled={!canEdit}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box',
                                    backgroundColor: canEdit ? 'white' : '#f5f5f5'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="serial" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Número de Serie
                            </label>
                            <input
                                id="serial"
                                name="serial"
                                type="text"
                                defaultValue={asset.serial || ''}
                                disabled={!canEdit}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box',
                                    backgroundColor: canEdit ? 'white' : '#f5f5f5'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Notas
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            defaultValue={asset.notes || ''}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        />
                    </div>

                    {canEdit && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Guardar Cambios
                            </button>
                            <Link
                                href="/assets"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#666',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    display: 'inline-block'
                                }}
                            >
                                Cancelar
                            </Link>
                        </div>
                    )}
                </form>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                        <strong>Creado:</strong> {new Date(asset.created_at).toLocaleString('es-MX')}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                        <strong>Actualizado:</strong> {new Date(asset.updated_at).toLocaleString('es-MX')}
                    </p>
                </div>

                {canDelete && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                        <h3 style={{ color: '#f44336', marginBottom: '1rem' }}>Zona de Peligro</h3>
                        <DeleteAssetButton assetId={asset.id} />
                    </div>
                )}
            </div>
        </div>
    )
}
