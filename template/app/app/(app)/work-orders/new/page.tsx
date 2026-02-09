import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createWorkOrderAction } from '@/app/actions/work-orders'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewWorkOrderPage() {
    const auth = await requireAuth()

    // Validar que sea Admin u Operador
    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const supabase = await createClient()

    // Obtener clientes
    const { data: clients } = await supabase
        .from('tenant_clients')
        .select('id, name')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    // Obtener activos
    const { data: assets } = await supabase
        .from('tenant_assets')
        .select('id, name, client_id')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/work-orders"
                    style={{ color: '#2196f3', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Volver a Órdenes
                </Link>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginTop: 0 }}>Nueva Orden de Servicio</h1>

                <form action={createWorkOrderAction}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="client_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Cliente <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            id="client_id"
                            name="client_id"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clients?.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="asset_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Activo (opcional)
                        </label>
                        <select
                            id="asset_id"
                            name="asset_id"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">Sin activo específico</option>
                            {assets?.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Título <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            autoFocus
                            placeholder="ej. Mantenimiento preventivo motor"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={6}
                            placeholder="Detalles del trabajo a realizar..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Estado Inicial
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue="open"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="draft">Borrador</option>
                            <option value="open">Abierta</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Crear Orden
                        </button>
                        <Link
                            href="/work-orders"
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
                </form>
            </div>
        </div>
    )
}
