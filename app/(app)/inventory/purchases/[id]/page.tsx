import { requireAuth } from '@/lib/auth/guards';
import { getPurchase } from '@/app/actions/purchases';
import Link from 'next/link';
import ReceivePurchaseModal from './ReceivePurchaseModal';

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return <div>Acceso Denegado</div>;

    const { id } = await params;
    const purchase = await getPurchase(id);

    if (!purchase) return <div>Compra no encontrada</div>;

    const isPending = purchase.status === 'pending';
    const isReceived = purchase.status === 'received';

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/inventory/purchases" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>
                    ← Volver a Compras
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <h1 style={{ margin: 0 }}>
                        Compra {purchase.id.split('-')[0].toUpperCase()}
                    </h1>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: isReceived ? '#e8f5e9' : (purchase.status === 'cancelled' ? '#ffebee' : '#fff3e0'),
                        color: isReceived ? '#2e7d32' : (purchase.status === 'cancelled' ? '#c62828' : '#ef6c00')
                    }}>
                        {purchase.status === 'pending' ? 'PENDIENTE' : (purchase.status === 'received' ? 'RECIBIDA' : 'CANCELADA')}
                    </span>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Proveedor</div>
                        <div style={{ fontWeight: 500, fontSize: '1.1rem' }}>{purchase.provider?.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Almacén Destino</div>
                        <div style={{ fontWeight: 500, fontSize: '1.1rem' }}>{purchase.location?.name}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Fecha Creación</div>
                        <div style={{ fontWeight: 500 }}>{new Date(purchase.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>Total {isReceived ? 'Real' : 'Estimado'}</div>
                        <div style={{ fontWeight: 600, fontSize: '1.2rem', color: '#2196f3' }}>
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(isReceived ? purchase.total_real : purchase.total_estimated)}
                        </div>
                    </div>
                </div>

                {purchase.notes && (
                    <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', fontStyle: 'italic', color: '#555' }}>
                        Nota: {purchase.notes}
                    </div>
                )}
            </div>

            {/* Items List */}
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    Detalle de Productos
                </h3>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9f9f9', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee' }}>Producto</th>
                            <th style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'center' }}>Cant. Solicitada</th>
                            <th style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'right' }}>Costo Est.</th>
                            {isReceived && (
                                <>
                                    <th style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'center', color: '#2e7d32' }}>Recibido</th>
                                    <th style={{ padding: '0.75rem', fontWeight: 600, borderBottom: '1px solid #eee', textAlign: 'right', color: '#2e7d32' }}>Costo Real</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {purchase.items.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.75rem' }}>{item.item?.name}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity_ordered}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.unit_cost_estimated)}
                                </td>
                                {isReceived && (
                                    <>
                                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>{item.quantity_received}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.unit_cost_real)}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isPending && ['Admin', 'Supervisor'].includes(auth.roleKey) && (
                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                    <ReceivePurchaseModal purchase={purchase} />
                </div>
            )}
        </div>
    );
}
