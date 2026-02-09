'use client';

import { useEffect, useState } from 'react';
import { getTransactions } from '@/app/actions/finance';
import { getBanks, type BankAccount } from '@/app/actions/banks';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ArrowUpCircle, ArrowDownCircle, Landmark, Search, Filter, PlusCircle, X } from 'lucide-react';
import { registerGeneralIncome } from '@/app/actions/finance';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterBank, setFilterBank] = useState('');
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [incomeData, setIncomeData] = useState({ bank_account_id: '', amount: 0, category: 'loan', description: '' });

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const [trxData, banksData] = await Promise.all([
                getTransactions(filterBank ? { bank_account_id: filterBank } : undefined),
                getBanks()
            ]);
            setTransactions(trxData);
            setBanks(banksData);
            setLoading(false);
        }
        loadData();
    }, [filterBank]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>Movimientos Bancarios</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Historial centralizado de ingresos y egresos</p>
                </div>
                <button
                    onClick={() => setShowIncomeModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#15803d',
                        color: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <PlusCircle size={20} />
                    Nuevo Ingreso
                </button>
            </div>

            {/* Filtros */}
            <div style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '1rem',
                marginBottom: '2rem',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <Filter size={18} color="#9ca3af" />
                    <select
                        value={filterBank}
                        onChange={(e) => setFilterBank(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.9rem',
                            width: '100%',
                            maxWidth: '300px'
                        }}
                    >
                        <option value="">Todas las cuentas</option>
                        {banks.map(bank => (
                            <option key={bank.id} value={bank.id}>{bank.bank_name} - {bank.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla de Movimientos */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Fecha</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Cuenta</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Concepto</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Categoría</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', textAlign: 'right' }}>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Cargando movimientos...</td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron movimientos registrados.</td>
                            </tr>
                        ) : (
                            transactions.map((trx) => (
                                <tr key={trx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{formatDate(trx.transaction_date)}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Landmark size={14} color="#6b7280" />
                                            <span style={{ fontSize: '0.85rem', color: '#374151' }}>{trx.bank?.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#111827' }}>{trx.description}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            backgroundColor: trx.amount > 0 ? '#dcfce7' : '#fee2e2',
                                            color: trx.amount > 0 ? '#166534' : '#991b1b'
                                        }}>
                                            {trx.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: trx.amount > 0 ? '#15803d' : '#dc2626' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                            {trx.amount > 0 ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                            {formatCurrency(Math.abs(trx.amount))}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Nuevo Ingreso */}
            {showIncomeModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    padding: '1rem', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', width: '100%',
                        maxWidth: '450px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Registrar Ingreso Externo</h2>
                            <button onClick={() => setShowIncomeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!incomeData.bank_account_id || incomeData.amount <= 0) {
                                alert('Completa los campos obligatorios');
                                return;
                            }
                            const res = await registerGeneralIncome(incomeData);
                            if (res.success) {
                                setShowIncomeModal(false);
                                window.location.reload();
                            } else {
                                alert(res.error);
                            }
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cuenta Destino</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    value={incomeData.bank_account_id}
                                    onChange={e => setIncomeData({ ...incomeData, bank_account_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccionar cuenta</option>
                                    {banks.map(bank => <option key={bank.id} value={bank.id}>{bank.bank_name} - {bank.name}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Monto</label>
                                <input
                                    type="number" step="0.01" required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.25rem', fontWeight: 700 }}
                                    value={incomeData.amount}
                                    onChange={e => setIncomeData({ ...incomeData, amount: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Concepto / Categoría</label>
                                <select
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    value={incomeData.category}
                                    onChange={e => setIncomeData({ ...incomeData, category: e.target.value })}
                                >
                                    <option value="loan">Préstamo / Aportación</option>
                                    <option value="adjustment">Ajuste de Saldo</option>
                                    <option value="other">Otro Ingreso</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Descripción</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    rows={2}
                                    value={incomeData.description}
                                    onChange={e => setIncomeData({ ...incomeData, description: e.target.value })}
                                    placeholder="Ej. Aportación de socio para compra de herramienta"
                                />
                            </div>

                            <button type="submit" style={{
                                width: '100%', padding: '0.75rem', backgroundColor: '#15803d', color: 'white',
                                borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer'
                            }}>
                                Registrar Ingreso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
