'use client';

import { useState } from 'react';
import { registerPayment } from '@/app/actions/treasury';

export default function CollectionList({ items }: { items: any[] }) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    // Modal State
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;
        setLoading(true);

        const res = await registerPayment(
            selectedOrder.id,
            Number(amount),
            method,
            notes
        );

        if (res.success) {
            setSelectedOrder(null);
            setAmount('');
            setNotes('');
            // UI refresh via server action revalidate
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    if (items.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', color: '#666' }}>
                No hay cuentas por cobrar en esta categoría.
            </div>
        );
    }

    return (
        <>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {items.map(item => {
                    const pending = item.total_amount - (item.amount_paid || 0);
                    const isPaid = item.payment_status === 'paid';

                    return (
                        <div key={item.id} style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                    {item.client?.name}
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                    Orden {item.title}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: isPaid ? '#4caf50' : '#333' }}>
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.total_amount)}
                                </div>
                                {!isPaid && (
                                    <div style={{ fontSize: '0.9rem', color: '#d32f2f' }}>
                                        Pendiente: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(pending)}
                                    </div>
                                )}
                                <div style={{ marginTop: '0.5rem' }}>
                                    {isPaid ? (
                                        <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            PAGADA
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(item);
                                                setAmount(pending.toString()); // Pre-fill with max
                                            }}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                background: '#2196f3',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 500
                                            }}
                                        >
                                            Registrar Pago
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {selectedOrder && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
                        <h2 style={{ marginTop: 0 }}>Registrar Pago</h2>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            Abono para orden <strong>{selectedOrder.title}</strong>
                        </p>

                        <form onSubmit={handlePayment}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Monto</label>
                                <input
                                    type="number" step="0.01" min="0.01" required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Método</label>
                                <select
                                    value={method} onChange={e => setMethod(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                >
                                    <option value="cash">Efectivo</option>
                                    <option value="transfer">Transferencia</option>
                                    <option value="card">Tarjeta</option>
                                    <option value="check">Cheque</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Nota (Opcional)</label>
                                <textarea
                                    value={notes} onChange={e => setNotes(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrder(null)}
                                    style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', background: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ padding: '0.75rem 1.5rem', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? 'Guardando...' : 'Guardar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
