
import Link from 'next/link'

interface WorkOrder {
    id: string
    title: string
    status: string
    created_at: string
    total_amount?: number // Optional if not always selected
}

interface ClientWorkOrdersListProps {
    clientId: string
    orders: WorkOrder[]
    type: 'service' | 'quote'
}

export function ClientWorkOrdersList({ clientId, orders, type }: ClientWorkOrdersListProps) {
    const isQuote = type === 'quote'
    const title = isQuote ? 'Cotizaciones' : 'Órdenes de Servicio'
    const createLabel = isQuote ? '+ Nueva Cotización' : '+ Nueva Orden'
    const emptyMessage = isQuote
        ? 'No hay cotizaciones registradas.'
        : 'No hay órdenes de servicio registradas.'

    // URL to create new: passing client_id pre-filled. 
    // If creating quote, we might pass ?status=quote if the creation form supports it, 
    // or just general new order form. Assuming generic new order for now.
    const createUrl = `/work-orders/new?client_id=${clientId}${isQuote ? '&status=quote' : ''}`

    if (orders.length === 0) {
        return (
            <div style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px dashed #ccc'
            }}>
                <p style={{ color: '#666', marginBottom: '1rem' }}>{emptyMessage}</p>
                <Link
                    href={createUrl}
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
                    {createLabel}
                </Link>
            </div>
        )
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return '#2196f3' // blue
            case 'in_progress': return '#ff9800' // orange
            case 'completed': return '#4caf50' // green
            case 'quote': return '#9c27b0' // purple
            case 'cancelled': return '#f44336' // red
            default: return '#999'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Abierta'
            case 'in_progress': return 'En Proceso'
            case 'completed': return 'Completada'
            case 'quote': return 'Cotización'
            case 'cancelled': return 'Cancelada'
            case 'draft': return 'Borrador'
            default: return status
        }
    }

    return (
        <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                    href={createUrl}
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
                    {createLabel}
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
                            <th style={{ padding: '0.75rem' }}>Folio / Título</th>
                            <th style={{ padding: '0.75rem' }}>Estado</th>
                            <th style={{ padding: '0.75rem' }}>Fecha</th>
                            <th style={{ padding: '0.75rem' }}>Total</th>
                            <th style={{ padding: '0.75rem' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ fontWeight: 500 }}>{order.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>ID: {order.id.substring(0, 8)}...</div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '12px',
                                        backgroundColor: `${getStatusColor(order.status)}20`,
                                        color: getStatusColor(order.status),
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        border: `1px solid ${getStatusColor(order.status)}40`
                                    }}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem', color: '#666' }}>
                                    {new Date(order.created_at).toLocaleDateString('es-MX')}
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                                    {order.total_amount ? `$${order.total_amount.toLocaleString('es-MX')}` : '-'}
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <Link
                                        href={`/work-orders/${order.id}`}
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
