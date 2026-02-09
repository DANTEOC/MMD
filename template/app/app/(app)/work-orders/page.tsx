import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    open: 'Abierta',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
    draft: '#9e9e9e',
    open: '#2196f3',
    in_progress: '#ff9800',
    completed: '#4caf50',
    cancelled: '#f44336',
}

export default async function WorkOrdersPage() {
    const auth = await requireAuth()
    const supabase = await createClient()

    const { data: workOrders, error } = await supabase
        .from('tenant_work_orders')
        .select(`
            *,
            tenant_clients (
                name
            ),
            tenant_assets (
                name
            )
        `)
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false })

    const canCreate = ['Admin', 'Operador'].includes(auth.roleKey)

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Órdenes de Servicio</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {canCreate && (
                        <Link
                            href="/work-orders/new"
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
                            + Nueva Orden
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

            {workOrders && workOrders.length > 0 ? (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Título</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Cliente</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Activo</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Creada</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workOrders.map((order) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{order.title}</td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {order.tenant_clients?.name || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {order.tenant_assets?.name || '-'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: STATUS_COLORS[order.status] + '20',
                                            color: STATUS_COLORS[order.status],
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500
                                        }}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                                        {new Date(order.created_at).toLocaleDateString('es-MX')}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <Link
                                            href={`/work-orders/${order.id}`}
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
                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>No hay órdenes de servicio registradas</p>
                    {canCreate && (
                        <Link
                            href="/work-orders/new"
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
                            Crear primera orden
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
