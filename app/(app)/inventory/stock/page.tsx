import { getStock } from '@/app/actions/inventory';
import StockActionsButtons from './StockActionsButtons';
import { requireAuth } from '@/lib/auth/guards';
import { AlertCircle } from 'lucide-react';

export default async function StockPage() {
    const stock = await getStock();
    const { roleKey } = await requireAuth();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Consultar Stock</h2>
                <StockActionsButtons roleKey={roleKey} />
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Item</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Ubicación</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563', textAlign: 'right' }}>Cantidad</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563', textAlign: 'right' }}>Última Verificación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No hay stock registrado
                                </td>
                            </tr>
                        ) : (
                            stock.map((item: any, index: number) => {
                                // Safe check for item existance (could be null if deleted but referential integrity should prevent it)
                                if (!item.item || !item.location) return null;

                                const isLowStock = item.quantity <= (item.item.min_stock || 0);

                                return (
                                    <tr key={`${item.item.id}-${item.location.id}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 1.5rem' }}>
                                            <div style={{ fontWeight: 500 }}>{item.item.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>SKU: {item.item.sku || '-'}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem', color: '#4b5563' }}>
                                            {item.location.name} <span style={{ fontSize: '0.75rem', color: '#999' }}>({item.location.type})</span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem',
                                                color: isLowStock ? '#d32f2f' : 'inherit', fontWeight: isLowStock ? 600 : 400
                                            }}>
                                                {isLowStock && <AlertCircle size={16} color="#d32f2f" />}
                                                {Number(item.quantity).toLocaleString()} {item.item.unit}
                                            </div>
                                            {isLowStock && <div style={{ fontSize: '0.7rem', color: '#d32f2f' }}>Stock bajo (Min: {item.item.min_stock})</div>}
                                        </td>
                                        <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', color: '#666' }}>
                                            {item.last_verified_at ? new Date(item.last_verified_at).toLocaleDateString('es-MX') : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
