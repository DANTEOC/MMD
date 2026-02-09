'use client';

import { useState } from 'react';
import { cancelExpenseAction } from '@/app/actions/finance';
import { type Provider } from '@/app/actions/providers';
import ExpenseForm from './expense-form';
import { Plus, Receipt, FileText, Calendar, Trash2 } from 'lucide-react';

interface Expense {
    id: string;
    concept?: string; // or in notes/reference
    notes?: string;
    total_amount: number;
    status: string;
    purchase_date: string;
    reference?: string;
    currency: string;
    provider?: { name: string };
    user?: { email: string; full_name: string | null };
}

interface ExpensesListProps {
    expenses: any[]; // Using any to avoid strict type mismatch with Supabase return for now
    providers: Provider[];
    role: string;
}

export default function ExpensesList({ expenses, providers, role }: ExpensesListProps) {
    const [showForm, setShowForm] = useState(false);

    // Permission check: Who can Add Expenses?
    const canAdd = ['Admin', 'Supervisor', 'Contador'].includes(role);

    const handleSuccess = () => {
        setShowForm(false);
        window.location.reload();
    };

    const handleCancel = async (id: string) => {
        if (!confirm('¿Estás seguro de cancelar este gasto? Los fondos regresarán a la cuenta bancaria si ya fue pagado.')) return;
        try {
            const res = await cancelExpenseAction(id);
            if (!res.success) alert(res.error);
            else window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error al cancelar gasto');
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency || 'MXN'
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Calculate Totals per currency
    const totalMXN = expenses
        .filter(e => e.currency === 'MXN' && e.status !== 'cancelled')
        .reduce((sum, e) => sum + (Number(e.total_real || e.total_estimated || e.total_amount) || 0), 0);

    const totalUSD = expenses
        .filter(e => e.currency === 'USD' && e.status !== 'cancelled')
        .reduce((sum, e) => sum + (Number(e.total_real || e.total_estimated || e.total_amount) || 0), 0);

    return (
        <div>
            {/* Header / Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', minWidth: '180px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Gastos (MXN)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{formatCurrency(totalMXN, 'MXN')}</div>
                    </div>
                    {totalUSD > 0 && (
                        <div style={{ padding: '1rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', minWidth: '180px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Gastos (USD)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{formatCurrency(totalUSD, 'USD')}</div>
                        </div>
                    )}
                </div>

                {canAdd && (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    >
                        <Plus size={20} /> Registrar Gasto
                    </button>
                )}
            </div>

            {expenses.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px dashed #e5e7eb',
                    color: '#6b7280'
                }}>
                    <Receipt size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        No hay gastos registrados
                    </h3>
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Concepto / Info</th>
                                <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Fecha</th>
                                <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Proveedor</th>
                                <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Usuario</th>
                                <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600 }}>Estado</th>
                                <th style={{ padding: '1rem', color: '#4b5563', fontWeight: 600, textAlign: 'right' }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense) => {
                                const amount = Number(expense.total_real || expense.total_amount || expense.total_estimated || 0);
                                const concept = expense.reference || expense.notes?.split('-')[0] || 'Sin concepto';

                                return (
                                    <tr key={expense.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                                                {concept}
                                            </div>
                                            {expense.reference && (
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <FileText size={12} /> {expense.reference}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} style={{ color: '#9ca3af' }} />
                                                {formatDate(expense.purchase_date || expense.created_at)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>
                                            {expense.provider?.name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Público / Caja</span>}
                                        </td>
                                        <td style={{ padding: '1rem', color: '#4b5563' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {expense.user?.full_name || expense.user?.email || <span style={{ color: '#9ca3af' }}>-</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: expense.status === 'paid' ? '#ecfdf5' : '#fffbeb',
                                                color: expense.status === 'paid' ? '#059669' : '#d97706',
                                                border: `1px solid ${expense.status === 'paid' ? '#a7f3d0' : '#fde68a'}`
                                            }}>
                                                {expense.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                                                {formatCurrency(amount, expense.currency)}
                                                {canAdd && expense.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => handleCancel(expense.id)}
                                                        title="Cancelar Gasto"
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <ExpenseForm
                    providers={providers}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
