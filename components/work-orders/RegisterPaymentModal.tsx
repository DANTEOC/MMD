'use client';

import { useState, useEffect } from 'react';
import { addWorkOrderPayment, type AddPaymentData } from '@/app/actions/payments';
import { getBanks, type BankAccount } from '@/app/actions/banks';
import { formatCurrency } from '@/lib/formatters';

type RegisterPaymentModalProps = {
    workOrder: any;
    onClose: () => void;
    onSuccess: () => void;
};

export default function RegisterPaymentModal({ workOrder, onClose, onSuccess }: RegisterPaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [banks, setBanks] = useState<BankAccount[]>([]);

    const [formData, setFormData] = useState<Partial<AddPaymentData>>({
        work_order_id: workOrder.id,
        amount: workOrder.total || 0,
        payment_method: 'transfer',
        payment_date: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
    });

    useEffect(() => {
        getBanks().then(setBanks);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.amount || formData.amount <= 0) {
            setError('El monto debe ser mayor a 0');
            setLoading(false);
            return;
        }

        const result = await addWorkOrderPayment(formData as AddPaymentData);

        if (!result.success) {
            setError(result.error || 'Error desconocido');
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <style jsx>{`
                .modal-content {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 500px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .form-group {
                    margin-bottom: 1rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .form-group input, .form-group select, .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }
            `}</style>

            <div className="modal-content">
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Registrar Pago</h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Orden: <strong>{workOrder.document_number || workOrder.id.substring(0, 8)}</strong><br />
                    Total Orden: <strong>{formatCurrency(workOrder.total)}</strong>
                </p>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Monto *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Método de Pago *</label>
                        <select
                            value={formData.payment_method}
                            onChange={e => setFormData({ ...formData, payment_method: e.target.value as any })}
                            required
                        >
                            <option value="transfer">Transferencia</option>
                            <option value="cash">Efectivo</option>
                            <option value="card">Tarjeta</option>
                            <option value="check">Cheque</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Cuenta Bancaria (opcional)</label>
                        <select
                            value={formData.bank_account_id || ''}
                            onChange={e => setFormData({ ...formData, bank_account_id: e.target.value || undefined })}
                        >
                            <option value="">-- Seleccionar cuenta --</option>
                            {banks.map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.name} ({bank.bank_name})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Fecha de Pago</label>
                        <input
                            type="date"
                            value={formData.payment_date}
                            onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Referencia / Folio</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Ej: Transf #12345"
                        />
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#15803d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Registrando...' : 'Confirmar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
