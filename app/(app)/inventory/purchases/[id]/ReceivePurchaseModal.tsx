'use client';

import { useState } from 'react';
import { receivePurchase } from '@/app/actions/purchases';

export default function ReceivePurchaseModal({ purchase }: { purchase: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<{ id: string, name: string, quantity: number, cost_real: number }[]>(
        purchase.items.map((i: any) => ({
            id: i.id,
            name: i.item.name,
            quantity: i.quantity_ordered,
            cost_real: i.unit_cost_estimated
        }))
    );

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: Number(value) } : i));
    };

    const handleConfirm = async () => {
        if (!confirm('¿Confirma que ha recibido estos productos? Esta acción impactará el inventario y no se puede deshacer.')) return;

        setLoading(true);
        const res = await receivePurchase(purchase.id, items);

        if (res.success) {
            setIsOpen(false);
            // Router refresh usually handled by action revalidate
        } else {
            alert(res.error);
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                Recibir Compra
            </button>
        );
    }

    const totalReal = items.reduce((sum, i) => sum + (i.quantity * i.cost_real), 0);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Recibir Compra</h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Confirme las cantidades y costos finales. Esto generará movimientos de entrada (IN) en <strong>{purchase.location?.name}</strong>.
                </p>

                <div style={{ marginBottom: '1.5rem', border: '1px solid #eee', borderRadius: '4px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', textAlign: 'left', fontSize: '0.85rem' }}>
                                <th style={{ padding: '0.75rem' }}>Producto</th>
                                <th style={{ padding: '0.75rem', width: '120px' }}>Cant. Recibida</th>
                                <th style={{ padding: '0.75rem', width: '120px' }}>Costo Unit. Real</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>{item.name}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.cost_real}
                                            onChange={(e) => updateItem(item.id, 'cost_real', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.quantity * item.cost_real)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ textAlign: 'right', marginBottom: '2rem', fontSize: '1.2rem' }}>
                    Total Recepción: <strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalReal)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: '1px solid #ddd',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 2rem',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Procesando...' : 'Confirmar Recepción'}
                    </button>
                </div>
            </div>
        </div>
    );
}
