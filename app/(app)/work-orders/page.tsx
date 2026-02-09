export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth/guards';
import { getWorkOrders } from '@/app/actions/work-orders';
import { getServiceTypes } from '@/app/actions/service-types';
import Link from 'next/link';
import WorkOrderFilters from './WorkOrderFilters';
import { formatCurrency } from '@/lib/formatters';

export default async function WorkOrdersPage({
    searchParams
}: {
    searchParams: Promise<{
        status?: string;
        priority?: string;
        assigned_to?: string;
        service_type?: string;
        client_query?: string;
        date_from?: string;
        date_to?: string;
    }>
}) {
    const auth = await requireAuth();

    // Safely handle searchParams which might be a promise or undefined in newer Next.js or just object in others
    // In strict Next.js 15 this is async, but usually provided as prop.

    const resolvedParams = await searchParams;

    const filters = {
        status: resolvedParams?.status || 'all',
        priority: resolvedParams?.priority || 'all',
        assigned_to: resolvedParams?.assigned_to || 'all',
        service_type: resolvedParams?.service_type || 'all',
        client_query: resolvedParams?.client_query || '',
        date_from: resolvedParams?.date_from || '',
        date_to: resolvedParams?.date_to || ''
    };

    const workOrders = await getWorkOrders(filters);
    const serviceTypes = await getServiceTypes(true);

    const showFinancials = auth.roleKey !== 'Tecnico';

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Órdenes de Servicio</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Quote Button (Admin/Sup only technically, but here filtered by role visibility usually) */}
                    {auth.roleKey !== 'Tecnico' && (
                        <>
                            <Link
                                href="/work-orders/new?mode=quote"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: 'white',
                                    color: '#2196f3',
                                    border: '1px solid #2196f3',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 500
                                }}
                            >
                                + Nueva Cotización
                            </Link>
                            <Link
                                href="/work-orders/new"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#2196f3',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 500
                                }}
                            >
                                + Nueva Orden
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <WorkOrderFilters currentFilters={filters} role={auth.roleKey} serviceTypes={serviceTypes} />
            </div>

            {workOrders.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>No se encontraron órdenes con estos filtros.</p>
                </div>
            ) : (
                <>
                    <style>{`
                    .desktop-table { display: table; width: 100%; border-collapse: collapse; }
                    .mobile-cards { display: none; }
                    
                    @media (max-width: 768px) {
                        .desktop-table { display: none; }
                        .mobile-cards { display: grid; gap: 1rem; grid-template-columns: 1fr; }
                        .wo-card {
                            background: white;
                            padding: 1rem;
                            border-radius: 8px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            border: 1px solid #eee;
                        }
                    }
                `}</style>

                    {/* Desktop View */}
                    <div className="desktop-view" style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <table className="desktop-table">
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Título</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente / Activo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Tipo</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Prioridad</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Estado</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Asignado a</th>
                                    {showFinancials && (
                                        <>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Costo</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Venta</th>
                                        </>
                                    )}
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Fecha</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workOrders.map((wo: any) => {
                                    const priorityColors: any = { low: '#4caf50', medium: '#2196f3', high: '#ff9800', urgent: '#d50000' };
                                    const statusLabels: any = {
                                        pending: 'Pendiente',
                                        in_progress: 'En Progreso',
                                        completed: 'Completada',
                                        cancelled: 'Cancelada',
                                        quote: 'Cotización'
                                    };
                                    const isQuote = wo.status === 'quote';

                                    return (
                                        <tr key={wo.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 500 }}>{wo.title}</div>
                                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                                    {wo.document_number || wo.id.split('-')[0]}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 500 }}>{wo.client?.name || '-'}</div>
                                                <div style={{ fontSize: '0.875rem', color: '#666' }}>{wo.asset?.name || '-'}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontSize: '0.875rem' }}>
                                                    {wo.service_type?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{ padding: '0.25rem 0.75rem', border: `1px solid ${priorityColors[wo.priority]}`, color: priorityColors[wo.priority], borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    {wo.priority}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: isQuote ? '#fff3e0' : '#f5f5f5',
                                                    color: isQuote ? '#ef6c00' : '#333',
                                                    border: isQuote ? '1px solid #ffe0b2' : 'none',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500
                                                }}>
                                                    {statusLabels[wo.status] || wo.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {wo.assignee?.full_name || wo.assignee?.email || '-'}
                                            </td>
                                            {showFinancials && (
                                                <>
                                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#666', fontSize: '0.9rem' }}>
                                                        {formatCurrency(wo.cost_total || 0)}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                                                        {formatCurrency(wo.total || 0)}
                                                    </td>
                                                </>
                                            )}
                                            <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', color: '#666' }}>
                                                {new Date(wo.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <Link href={`/work-orders/${wo.id}`} style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 500 }}>Ver</Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="mobile-cards">
                        {workOrders.map((wo: any) => {
                            const priorityColors: any = { low: '#4caf50', medium: '#2196f3', high: '#ff9800', urgent: '#d50000' };
                            const statusLabels: any = { pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completada', cancelled: 'Cancelada' };
                            return (
                                <div key={wo.id} className="wo-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{wo.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#999' }}>
                                                {wo.document_number || wo.id.split('-')[0]}
                                            </div>
                                        </div>
                                        <span style={{ padding: '0.25rem 0.5rem', border: `1px solid ${priorityColors[wo.priority]}`, color: priorityColors[wo.priority], borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                            {wo.priority}
                                        </span>
                                    </div>
                                    {showFinancials && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                            {/* Assuming DollarSign is an imported component or icon */}
                                            {/* <DollarSign size={16} className="text-gray-400" /> */}
                                            <span style={{ fontWeight: 600, color: '#059669' }}>
                                                {formatCurrency(wo.total || 0)}
                                            </span>
                                        </div>
                                    )}
                                    <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        <div style={{ color: '#333', fontWeight: 500 }}>{wo.client?.name}</div>
                                        <div style={{ color: '#666' }}>{wo.asset?.name}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f5f5f5', color: '#333', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500 }}>
                                            {statusLabels[wo.status] || wo.status}
                                        </span>
                                        <Link href={`/work-orders/${wo.id}`} style={{ padding: '0.5rem 1rem', backgroundColor: '#2196f3', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '0.875rem' }}>Ver Detalle</Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
