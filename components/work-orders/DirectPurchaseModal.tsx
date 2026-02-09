'use client';

import { useState, useEffect } from 'react';
import { registerWorkOrderExpense, type ExpenseData } from '@/app/actions/finance';
import { getBanks, type BankAccount } from '@/app/actions/banks';
import { Loader2, X, Save, DollarSign, Store, Tag, FileText, Landmark } from 'lucide-react';

interface DirectPurchaseModalProps {
    workOrderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DirectPurchaseModal({ workOrderId, onClose, onSuccess }: DirectPurchaseModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [banks, setBanks] = useState<BankAccount[]>([]);

    useEffect(() => {
        getBanks().then(setBanks);
    }, []);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);

        const amount = parseFloat(formData.get('total_amount')?.toString() || '0');
        if (amount <= 0) {
            setError('El costo debe ser mayor a 0');
            setLoading(false);
            return;
        }

        const concept = formData.get('concept')?.toString();
        if (!concept) {
            setError('Indica qué compraste (Material/Refacción)');
            setLoading(false);
            return;
        }

        const data: ExpenseData = {
            work_order_id: workOrderId,
            concept: concept,
            purchase_date: new Date().toISOString().split('T')[0], // Today
            total_amount: amount,
            currency: 'MXN', // Default for technicians, maybe add selector if needed
            status: (formData.get('is_paid') === 'on') ? 'paid' : 'pending',
            provider_id: undefined, // "General / Caja Chica" usually
            reference: formData.get('reference')?.toString() || undefined,
            notes: formData.get('notes')?.toString() || undefined,
            bank_account_id: formData.get('bank_account_id')?.toString() || undefined
        };

        try {
            const result = await registerWorkOrderExpense(data);
            if (!result.success) {
                setError(result.error || 'Error desconocido');
                if (result.warning) alert(result.warning); // Show warning if line failed but purchase ok
            } else {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrar compra');
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
                        Registrar Compra Material
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
                    <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666', backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #dbeafe' }}>
                        Esto registrará el gasto y agregará automáticamente el material a la orden.
                    </div>

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

                    <form action={handleSubmit} id="direct-purchase-form">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="concept" style={labelStyle}>
                                <Tag size={16} /> ¿Qué compraste?
                            </label>
                            <input
                                type="text"
                                id="concept"
                                name="concept"
                                placeholder="Ej. Aceite, Filtro, Tornillos..."
                                required
                                style={{ ...inputStyle, fontSize: '1.1rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="total_amount" style={labelStyle}>
                                <DollarSign size={16} /> Costo Total
                            </label>
                            <input
                                type="number"
                                id="total_amount"
                                name="total_amount"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                required
                                style={{ ...inputStyle, fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="reference" style={labelStyle}>
                                <Store size={16} /> Lugar de Compra / Referencia
                            </label>
                            <input
                                type="text"
                                id="reference"
                                name="reference"
                                placeholder="Ej. AutoZone, Ferretaría, Ticket #123"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <input
                                type="checkbox"
                                id="is_paid"
                                name="is_paid"
                                defaultChecked={true}
                                style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            <div>
                                <label htmlFor="is_paid" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', display: 'block' }}>
                                    Ya lo pagué (Efectivo/Tarjeta Propia)
                                </label>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    Desmarcar si fue a Crédito o cuenta del Taller.
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="bank_account_id" style={labelStyle}>
                                <Landmark size={16} /> Cuenta de Pago
                            </label>
                            <select
                                id="bank_account_id"
                                name="bank_account_id"
                                style={inputStyle}
                            >
                                <option value="">-- Seleccionar cuenta --</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id}>
                                        {bank.bank_name} - {bank.name} (${(bank.current_balance ?? bank.initial_balance).toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="notes" style={labelStyle}>
                                <FileText size={16} /> Notas
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
                        form="direct-purchase-form"
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
                        {loading ? 'Registrando...' : 'Registrar Compra'}
                    </button>
                </div>
            </div>
        </div>
    );
}
