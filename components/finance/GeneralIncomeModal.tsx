'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { registerGeneralIncome } from '@/app/actions/finance';
import { type BankAccount } from '@/app/actions/banks';

interface GeneralIncomeModalProps {
    banks: BankAccount[];
    onClose: () => void;
    onSuccess: () => void;
}

export function GeneralIncomeModal({ banks, onClose, onSuccess }: GeneralIncomeModalProps) {
    const [incomeData, setIncomeData] = useState({
        bank_account_id: '',
        amount: 0,
        category: 'loan',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!incomeData.bank_account_id || incomeData.amount <= 0) {
            alert('Completa los campos obligatorios');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await registerGeneralIncome(incomeData);
            if (res.success) {
                onSuccess();
            } else {
                alert(res.error);
            }
        } catch (error) {
            console.error('Error registering income:', error);
            alert('Error al registrar el ingreso');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
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
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cuenta Destino</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={incomeData.bank_account_id}
                            onChange={e => setIncomeData({ ...incomeData, bank_account_id: e.target.value })}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Seleccionar cuenta</option>
                            {banks.map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.bank_name} - {bank.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Monto</label>
                        <input
                            type="number" step="0.01" required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.25rem', fontWeight: 700 }}
                            value={incomeData.amount}
                            onChange={e => setIncomeData({ ...incomeData, amount: parseFloat(e.target.value) })}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Concepto / Categoría</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            value={incomeData.category}
                            onChange={e => setIncomeData({ ...incomeData, category: e.target.value })}
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%', padding: '0.75rem', backgroundColor: '#15803d', color: 'white',
                            borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
                            opacity: isSubmitting ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? 'Registrando...' : 'Registrar Ingreso'}
                    </button>
                </form>
            </div>
        </div>
    );
}
