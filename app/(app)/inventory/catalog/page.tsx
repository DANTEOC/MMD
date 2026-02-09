import { getItems } from '@/app/actions/inventory';
import CreateItemButton from './CreateItemButton';
import EditItemModal from './EditItemModal';
import ItemActions from './ItemActions';
import { requireAuth } from '@/lib/auth/guards';
import { Package, Wrench } from 'lucide-react';

export default async function CatalogPage() {
    const items = await getItems();
    const { roleKey } = await requireAuth();
    const canEdit = ['Admin', 'Supervisor'].includes(roleKey);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Catálogo de Items</h2>
                {canEdit && <CreateItemButton />}
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Tipo</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Nombre</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Unidad</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Min. Stock</th>
                            <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Estado</th>
                            {canEdit && <th style={{ padding: '0.75rem 1.5rem', fontWeight: 600, color: '#4b5563' }}>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No hay items registrados
                                </td>
                            </tr>
                        ) : (
                            items.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                            padding: '0.25rem 0.5rem', borderRadius: '4px',
                                            backgroundColor: item.kind === 'PRODUCT' ? '#e3f2fd' : '#f3e5f5',
                                            color: item.kind === 'PRODUCT' ? '#1976d2' : '#7b1fa2',
                                            fontSize: '0.75rem', fontWeight: 500
                                        }}>
                                            {item.kind === 'PRODUCT' ? <Package size={14} /> : <Wrench size={14} />}
                                            {item.kind === 'PRODUCT' ? 'Producto' : 'Servicio'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>{item.name}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', color: '#666' }}>{item.unit}</td>
                                    <td style={{ padding: '0.75rem 1.5rem', color: '#666' }}>{item.is_stockable ? item.min_stock : '-'}</td>
                                    <td style={{ padding: '0.75rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.125rem 0.375rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                                            backgroundColor: item.is_active ? '#dcfce7' : '#fee2e2',
                                            color: item.is_active ? '#166534' : '#991b1b'
                                        }}>
                                            {item.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <EditItemModal item={item} />
                                            <ItemActions item={item} />
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
