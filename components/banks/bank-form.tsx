'use client';

import { BankAccount, createBankAction, updateBankAction } from '@/app/actions/banks';
import { X, Save, Loader2, CreditCard } from 'lucide-react';
import { useState } from 'react';

export function BankForm({ bank, onClose }: { bank?: BankAccount | null, onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError('');
        try {
            if (bank) {
                await updateBankAction(bank.id, formData);
            } else {
                await createBankAction(formData);
            }
            onClose();
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '24px 32px',
                backgroundColor: 'white',
                borderBottom: '1px solid #f3f4f6',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                        {bank ? 'Editar Cuenta' : 'Nueva Cuenta'}
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px', margin: 0 }}>
                        {bank ? 'Modifica los detalles de la cuenta bancaria.' : 'Registra una nueva cuenta para tu tesorería.'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px', cursor: 'pointer', borderRadius: '50%',
                        border: 'none', backgroundColor: 'transparent', color: '#9ca3af',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#4b5563' }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Form */}
            <form action={handleSubmit} style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
                {error && (
                    <div style={{
                        backgroundColor: '#fef2f2', color: '#b91c1c', padding: '16px',
                        borderRadius: '12px', fontSize: '0.875rem', border: '1px solid #fecaca',
                        marginBottom: '24px', display: 'flex', gap: '12px'
                    }}>
                        <div style={{ padding: '4px', backgroundColor: '#fee2e2', borderRadius: '50%', height: 'fit-content' }}>
                            <X size={14} style={{ color: '#dc2626' }} />
                        </div>
                        {error}
                    </div>
                )}

                {/* Section: Identificación */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
                    }}>
                        <span style={{ width: '4px', height: '16px', backgroundColor: '#2563eb', borderRadius: '9999px' }}></span>
                        Identificación
                    </h3>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                            Nombre Identificador <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            defaultValue={bank?.name || ''}
                            placeholder="Ej: BBVA Operativa Principal"
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '12px',
                                border: '1px solid #e5e7eb', backgroundColor: 'white',
                                fontSize: '1rem', color: '#111827', outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>Nombre interno para identificar la cuenta en reportes.</p>
                    </div>
                </div>

                <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '24px 0' }}></div>

                {/* Section: Detalles Bancarios */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{
                        fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: '#111827', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
                    }}>
                        <span style={{ width: '4px', height: '16px', backgroundColor: '#4f46e5', borderRadius: '9999px' }}></span>
                        Detalles Financieros
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                Banco <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="bank_name"
                                required
                                defaultValue={bank?.bank_name || ''}
                                placeholder="Ej: BBVA"
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '1rem', color: '#111827', outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                Moneda <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <select
                                name="currency"
                                required
                                defaultValue={bank?.currency || 'MXN'}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid #e5e7eb', backgroundColor: 'white',
                                    fontSize: '1rem', color: '#111827', outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="MXN">Pesos Mexicanos (MXN)</option>
                                <option value="USD">Dólares Americanos (USD)</option>
                                <option value="EUR">Euros (EUR)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                            Número de Cuenta / CLABE <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                                <CreditCard size={18} />
                            </div>
                            <input
                                type="text"
                                name="account_number"
                                required
                                defaultValue={bank?.account_number || ''}
                                placeholder="0000 0000 0000 0000"
                                style={{
                                    width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.05em',
                                    color: '#374151', outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {!bank && (
                        <div style={{ marginTop: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                                Saldo Inicial
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#9ca3af' }}>$</span>
                                <input
                                    type="number"
                                    name="initial_balance"
                                    step="0.01"
                                    defaultValue={0}
                                    style={{
                                        width: '100%', padding: '12px 16px 12px 32px', borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        fontWeight: 700, fontSize: '1.1rem',
                                        color: '#111827', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '8px' }}>Saldo de apertura de la cuenta.</p>
                        </div>
                    )}
                </div>

                {bank && (
                    <div style={{
                        backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px',
                        display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #f3f4f6'
                    }}>
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            defaultChecked={bank.is_active}
                            style={{
                                width: '20px', height: '20px', borderRadius: '6px',
                                cursor: 'pointer', accentColor: '#2563eb'
                            }}
                        />
                        <label htmlFor="is_active" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', cursor: 'pointer' }}>
                            Cuenta Activa (Disponible para operaciones)
                        </label>
                    </div>
                )}

                {/* Footer Buttons */}
                <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: '12px',
                    paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #f3f4f6'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '10px 24px', fontSize: '0.875rem', fontWeight: 500,
                            color: '#4b5563', backgroundColor: 'white',
                            border: '1px solid #e5e7eb', borderRadius: '12px',
                            cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        style={{
                            padding: '10px 24px', fontSize: '0.875rem', fontWeight: 500,
                            color: 'white', backgroundColor: '#111827',
                            border: 'none', borderRadius: '12px',
                            cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: isLoading ? 0.7 : 1
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'black'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Guardar Cuenta
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
