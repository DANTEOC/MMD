'use client';

import { useState } from 'react';
import { registerExpense } from '@/app/actions/treasury';

export default function CashFlowTabs({ initialData, date }: { initialData: any, date: string }) {
    const [activeTab, setActiveTab] = useState<'summary' | 'income' | 'expenses'>('summary');

    // Expense Modal
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [concept, setConcept] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const incomeTotal = initialData?.income?.reduce((sum: number, i: any) => sum + i.amount, 0) || 0;
    const expensesTotal = initialData?.expenses?.reduce((sum: number, i: any) => sum + i.amount, 0) || 0;
    const balance = incomeTotal - expensesTotal;

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await registerExpense({
            concept,
            amount: Number(amount),
            date,
            notes
        });

        if (res.success) {
            setShowExpenseModal(false);
            setConcept('');
            setAmount('');
            setNotes('');
            // UI refresh automatic via revalidatePath
        } else {
            alert(res.error);
        }
        setLoading(false);
    };

    return (
        <>
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('summary')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'summary' ? '2px solid #2196f3' : 'none',
                        color: activeTab === 'summary' ? '#2196f3' : '#666',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Resumen
                </button>
                <button
                    onClick={() => setActiveTab('income')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'income' ? '2px solid #2196f3' : 'none',
                        color: activeTab === 'income' ? '#2196f3' : '#666',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Ingresos ({initialData?.income?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    style={{
                        padding: '1rem 2rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'expenses' ? '2px solid #2196f3' : 'none',
                        color: activeTab === 'expenses' ? '#2196f3' : '#666',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Egresos ({initialData?.expenses?.length || 0})
                </button>
            </div>

            {/* Tab: Summary */}
            {activeTab === 'summary' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Ingresos</div>
                        <div style={{ fontSize: '2rem', fontWeight: 600, color: '#4caf50' }}>+{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(incomeTotal)}</div>
                    </div>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Egresos</div>
                        <div style={{ fontSize: '2rem', fontWeight: 600, color: '#f44336' }}>-{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(expensesTotal)}</div>
                    </div>
                    <div style={{ background: balance >= 0 ? '#e8f5e9' : '#ffebee', padding: '2rem', borderRadius: '8px', textAlign: 'center', border: `1px solid ${balance >= 0 ? '#a5d6a7' : '#ef9a9a'}` }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Balance del Día</div>
                        <div style={{ fontSize: '2rem', fontWeight: 600, color: balance >= 0 ? '#2e7d32' : '#c62828' }}>
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(balance)}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Income */}
            {activeTab === 'income' && (
                <div>
                    {initialData?.income?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No hay ingresos registrados en esta fecha.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {initialData.income.map((inc: any) => (
                                <div key={inc.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Pago Orden {inc.work_order?.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{inc.method} • {new Date(inc.created_at).toLocaleTimeString()}</div>
                                        {inc.notes && <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>"{inc.notes}"</div>}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#4caf50', fontSize: '1.1rem' }}>
                                        +{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(inc.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Expenses */}
            {activeTab === 'expenses' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            + Nuevo Egreso
                        </button>
                    </div>

                    {initialData?.expenses?.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No hay egresos registrados en esta fecha.</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {initialData.expenses.map((exp: any) => (
                                <div key={exp.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{exp.concept}</div>
                                        {exp.notes && <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>"{exp.notes}"</div>}
                                    </div>
                                    <div style={{ fontWeight: 600, color: '#f44336', fontSize: '1.1rem' }}>
                                        -{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(exp.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Expense Modal */}
            {showExpenseModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
                        <h2 style={{ marginTop: 0 }}>Registrar Egreso</h2>
                        <form onSubmit={handleAddExpense}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Concepto</label>
                                <input type="text" required value={concept} onChange={e => setConcept(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Monto</label>
                                <input type="number" step="0.01" min="0.01" required value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Nota (Opcional)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowExpenseModal(false)} style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', background: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{loading ? 'Guardando...' : 'Guardar Egreso'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
