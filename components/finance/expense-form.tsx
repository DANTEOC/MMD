'use client';

import { useState } from 'react';
import { registerExpenseAction, type ExpenseData } from '@/app/actions/finance';
import { type Provider } from '@/app/actions/providers';
import { Loader2, X, Save, DollarSign, Calendar, FileText, Tag, Receipt } from 'lucide-react';

interface ExpenseFormProps {
    providers: Provider[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function ExpenseForm({ providers, onClose, onSuccess }: ExpenseFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);

        const amount = parseFloat(formData.get('total_amount')?.toString() || '0');
        if (amount <= 0) {
            setError('El monto debe ser mayor a 0');
            setLoading(false);
            return;
        }

        const data: ExpenseData = {
            concept: formData.get('concept')?.toString() || '',
            purchase_date: formData.get('purchase_date')?.toString() || new Date().toISOString().split('T')[0],
            total_amount: amount,
            currency: formData.get('currency')?.toString() as 'MXN' | 'USD' | 'EUR',
            status: formData.get('status')?.toString() as 'pending' | 'paid',
            provider_id: formData.get('provider_id')?.toString() || undefined,
            reference: formData.get('reference')?.toString() || undefined,
            notes: formData.get('notes')?.toString() || undefined
        };

        if (!data.concept) {
            setError('El concepto es requerido');
            setLoading(false);
            return;
        }

        try {
            const result = await registerExpenseAction(data);
            if (!result.success) {
                throw new Error(result.error);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al registrar gasto');
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
                maxWidth: '600px',
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Nuevo Gasto
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                    >
                        <X size={24} />
                    </button>
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

                    <form action={handleSubmit} id="expense-form">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="concept" style={labelStyle}>
                                <FileText size={16} /> Concepto
                            </label>
                            <input
                                type="text"
                                id="concept"
                                name="concept"
                                placeholder="Ej. Pago de Luz Marzo"
                                required
                                style={{ ...inputStyle, border: '1px solid #e5e7eb', backgroundColor: '#fff', fontSize: '1.1rem' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label htmlFor="total_amount" style={labelStyle}>
                                    <DollarSign size={16} /> Monto
                                </label>
                                <input
                                    type="number"
                                    id="total_amount"
                                    name="total_amount"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    required
                                    style={{ ...inputStyle, fontWeight: 700 }}
                                />
                            </div>
                            <div>
                                <label htmlFor="provider_id" style={labelStyle}>
                                    <Receipt size={16} /> Proveedor (Opcional)
                                </label>
                                <select
                                    id="provider_id"
                                    name="provider_id"
                                    style={inputStyle}
                                >
                                    <option value="">-- Público General / Caja --</option>
                                    {providers.filter(p => p.is_active).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label htmlFor="purchase_date" style={labelStyle}>
                                    <Calendar size={16} /> Fecha Gasto
                                </label>
                                <input
                                    type="date"
                                    id="purchase_date"
                                    name="purchase_date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label htmlFor="status" style={labelStyle}>
                                    <Tag size={16} /> Estado
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    defaultValue="pending"
                                    style={inputStyle}
                                >
                                    <option value="pending">Pendiente de Pago</option>
                                    <option value="paid">Pagado</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                            <div>
                                <label htmlFor="reference" style={labelStyle}>
                                    Referencia / Folio
                                </label>
                                <input
                                    type="text"
                                    id="reference"
                                    name="reference"
                                    placeholder="Factura A-123"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label htmlFor="currency" style={labelStyle}>
                                    Moneda
                                </label>
                                <select
                                    id="currency"
                                    name="currency"
                                    defaultValue="MXN"
                                    style={inputStyle}
                                >
                                    <option value="MXN">Pesos (MXN)</option>
                                    <option value="USD">Dólares (USD)</option>
                                    <option value="EUR">Euros (EUR)</option>
                                </select>
                            </div>
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
                                placeholder="Detalles adicionales..."
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
                        form="expense-form"
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {loading ? 'Registrar' : 'Registrar Gasto'}
                    </button>
                </div>
            </div>
        </div>
    );
}
