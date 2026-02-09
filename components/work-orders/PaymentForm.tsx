'use client';

import { useState } from 'react';
import { registerPaymentAction, type PaymentData } from '@/app/actions/finance';
import { Loader2, X, Save, DollarSign, CreditCard, Banknote, FileText } from 'lucide-react';

interface PaymentFormProps {
    workOrderId: string;
    totalAmount: number;
    amountPaid: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PaymentForm({ workOrderId, totalAmount, amountPaid, onClose, onSuccess }: PaymentFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate remaining balance
    const remaining = Math.max(0, totalAmount - amountPaid);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);

        const amount = parseFloat(formData.get('amount')?.toString() || '0');

        if (amount <= 0) {
            setError('El monto debe ser mayor a 0');
            setLoading(false);
            return;
        }

        const data: PaymentData = {
            work_order_id: workOrderId,
            amount: amount,
            method: formData.get('method')?.toString() as any,
            reference: formData.get('reference')?.toString(),
            notes: formData.get('notes')?.toString(),
            // bank_account_id: formData.get('bank_account_id')?.toString() || undefined
        };

        try {
            const result = await registerPaymentAction(data);
            if (!result.success) {
                throw new Error(result.error);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al registrar pago');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s',
        marginBottom: '1rem',
        fontFamily: 'inherit',
        backgroundColor: '#f9fafb'
    };

    const labelStyle = {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#4b5563',
        marginBottom: '0.4rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
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
            zIndex: 50,
            padding: '1rem',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Registrar Pago
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Info Card */}
                <div style={{ padding: '1rem 2rem', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Orden:</span>
                        <span style={{ fontWeight: 600 }}>${totalAmount.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Pagado:</span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>${amountPaid.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Saldo Pendiente:</span>
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>${remaining.toLocaleString()}</span>
                    </div>
                </div>

                {/* Form Body */}
                <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                    {error && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form action={handleSubmit} id="payment-form">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="amount" style={labelStyle}>
                                <DollarSign size={16} /> Monto a Pagar
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                defaultValue={remaining}
                                max={remaining > 0 ? remaining : undefined} // Sugerencia, no estricto
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                required
                                style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="method" style={labelStyle}>
                                <CreditCard size={16} /> Método de Pago
                            </label>
                            <select
                                id="method"
                                name="method"
                                defaultValue="transfer"
                                style={inputStyle}
                            >
                                <option value="cash">Efectivo</option>
                                <option value="transfer">Transferencia</option>
                                <option value="card">Tarjeta</option>
                                <option value="check">Cheque</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="reference" style={labelStyle}>
                                <FileText size={16} /> Referencia (Opcional)
                            </label>
                            <input
                                type="text"
                                id="reference"
                                name="reference"
                                placeholder="Folio de transferencia, # cheque..."
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label htmlFor="notes" style={labelStyle}>
                                Notas
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={2}
                                style={inputStyle}
                                placeholder="Comentarios adicionales..."
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            backgroundColor: 'white',
                            color: '#374151',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="payment-form"
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#16a34a', // Green-600
                            color: 'white',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? 'Registrando...' : 'Registrar Pago'}
                    </button>
                </div>
            </div>
        </div>
    );
}
