import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { updateClient } from '@/app/actions/clients'
import { DeleteClientButton } from './DeleteClientButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
    const auth = await requireAuth()
    const supabase = await createClient()

    const { data: client, error } = await supabase
        .from('tenant_clients')
        .select('*')
        .eq('id', params.id)
        .eq('tenant_id', auth.tenantId)
        .single()

    if (error || !client) {
        notFound()
    }

    const canEdit = ['Admin', 'Operador'].includes(auth.roleKey)
    const canDelete = auth.roleKey === 'Admin'

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/clients"
                    style={{ color: '#2196f3', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Volver a Clientes
                </Link>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginTop: 0 }}>
                    {canEdit ? 'Editar Cliente' : 'Detalle de Cliente'}
                </h1>

                <form action={updateClient.bind(null, client.id)}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Nombre <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            defaultValue={client.name}
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
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={client.email || ''}
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
                        <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Teléfono
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={client.phone || ''}
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
                        <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Notas
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            defaultValue={client.notes || ''}
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
                                href="/clients"
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
                        <strong>Creado:</strong> {new Date(client.created_at).toLocaleString('es-MX')}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                        <strong>Actualizado:</strong> {new Date(client.updated_at).toLocaleString('es-MX')}
                    </p>
                </div>

                {canDelete && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                        <h3 style={{ color: '#f44336', marginBottom: '1rem' }}>Zona de Peligro</h3>
                        <DeleteClientButton clientId={client.id} />
                    </div>
                )}
            </div>
        </div>
    )
}
