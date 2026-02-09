'use client';

import { useState } from 'react';
import { BankAccount, deleteBankAction } from '@/app/actions/banks';
import { Edit, Trash2, CreditCard } from 'lucide-react';
import { BankForm } from './bank-form';

export function BankList({ banks, role }: { banks: BankAccount[], role: string }) {
    const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const canManage = ['Admin', 'Supervisor', 'Contador'].includes(role);
    const canDelete = role === 'Admin';

    const handleEdit = (bank: BankAccount) => {
        setEditingBank(bank);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) {
            await deleteBankAction(id);
        }
    };

    // Helper to determine gradient based on bank name
    const getBankStyle = (bankName: string) => {
        const name = bankName.toLowerCase();
        if (name.includes('bbva')) return 'linear-gradient(135deg, #004481 0%, #1464A5 100%)';
        if (name.includes('hsbc')) return 'linear-gradient(135deg, #db0011 0%, #ff4d4d 100%)';
        if (name.includes('santander')) return 'linear-gradient(135deg, #ec0000 0%, #ff4d4d 100%)';
        if (name.includes('amex') || name.includes('american')) return 'linear-gradient(135deg, #2f2f2f 0%, #4a4a4a 100%)';
        if (name.includes('citibanamex') || name.includes('banamex')) return 'linear-gradient(135deg, #002a8f 0%, #005be4 100%)';
        if (name.includes('scotiabank')) return 'linear-gradient(135deg, #ec111a 0%, #f64e56 100%)';
        if (name.includes('banorte')) return 'linear-gradient(135deg, #d51f28 0%, #ea5c63 100%)';
        return 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'; // Default Dark
    };

    return (
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header Actions */}
            {canManage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                    <button
                        onClick={() => { setEditingBank(null); setIsFormOpen(true); }}
                        style={{
                            backgroundColor: '#1f2937',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#000'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    >
                        <CreditCard size={18} />
                        Nueva Cuenta
                    </button>
                </div>
            )}

            {/* Banks Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '2rem'
            }}>
                {banks.map((bank) => {
                    const background = getBankStyle(bank.bank_name);

                    return (
                        <div key={bank.id} style={{ position: 'relative' }}>
                            {/* Card Visual */}
                            <div style={{
                                background: background,
                                color: 'white',
                                aspectRatio: '1.586 / 1',
                                borderRadius: '16px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'transform 0.3s ease'
                            }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Chip & Status */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
                                    <div style={{
                                        width: '48px', height: '36px',
                                        backgroundColor: 'rgba(255, 230, 0, 0.85)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
                                        <div style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
                                        <div style={{ position: 'absolute', right: '25%', top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
                                    </div>
                                    {!bank.is_active && (
                                        <span style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                                            color: 'white',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            padding: '4px 8px',
                                            borderRadius: '9999px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Inactiva
                                        </span>
                                    )}
                                </div>

                                {/* Middle: Account Number & Bank Name */}
                                <div style={{ marginTop: 'auto', marginBottom: '16px', position: 'relative', zIndex: 10 }}>
                                    <p style={{ fontSize: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
                                        {bank.bank_name}
                                    </p>
                                    <p style={{ fontFamily: 'monospace', fontSize: '1.4rem', letterSpacing: '0.15em', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                        •••• {bank.account_number.slice(-4)}
                                    </p>
                                </div>

                                {/* Bottom: Name & Balance */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
                                    <div>
                                        <p style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Titular</p>
                                        <p style={{ fontSize: '0.95rem', fontWeight: 500, maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                            {bank.name}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>{bank.currency}</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                            ${(bank.current_balance ?? bank.initial_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions (visible only if managed) */}
                            {canManage && (
                                <div style={{
                                    position: 'absolute', top: '16px', right: '16px', zIndex: 20,
                                    display: 'flex', gap: '8px'
                                }}>
                                    <div style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: '8px',
                                        padding: '4px',
                                        display: 'flex', gap: '4px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(bank); }}
                                            style={{ padding: '6px', color: '#4b5563', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}
                                            title="Editar"
                                            onMouseOver={(e) => e.currentTarget.style.color = '#2563eb'}
                                            onMouseOut={(e) => e.currentTarget.style.color = '#4b5563'}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {canDelete && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(bank.id); }}
                                                style={{ padding: '6px', color: '#4b5563', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '4px' }}
                                                title="Eliminar"
                                                onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                                                onMouseOut={(e) => e.currentTarget.style.color = '#4b5563'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Empty State Card */}
                {banks.length === 0 && (
                    <button
                        onClick={() => canManage && setIsFormOpen(true)}
                        style={{
                            aspectRatio: '1.586 / 1',
                            borderRadius: '16px',
                            border: '2px dashed #d1d5db',
                            backgroundColor: '#f9fafb',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            cursor: canManage ? 'pointer' : 'default',
                            gap: '12px',
                            color: '#6b7280',
                            transition: 'all 0.2s',
                            padding: '0', margin: '0' // Reset button defaults
                        }}
                        onMouseOver={(e) => canManage && (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                        onMouseOut={(e) => canManage && (e.currentTarget.style.backgroundColor = '#f9fafb')}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            backgroundColor: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            <CreditCard size={24} style={{ opacity: 0.5 }} />
                        </div>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Agregar Primera Cuenta</span>
                    </button>
                )}
            </div>

            {/* Modal / Form */}
            {isFormOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        width: '100%', maxWidth: '480px', maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <BankForm
                            bank={editingBank}
                            onClose={() => setIsFormOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
