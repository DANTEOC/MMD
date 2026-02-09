'use client';

import { useState } from 'react';
import { createProviderAction, updateProviderAction, type Provider } from '@/app/actions/providers';
import { Loader2, X, Save, Building2, User, Phone, Mail, FileText, CreditCard } from 'lucide-react';

interface ProviderFormProps {
    provider?: Provider;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProviderForm({ provider, onClose, onSuccess }: ProviderFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError(null);

        try {
            if (provider) {
                await updateProviderAction(provider.id, formData);
            } else {
                await createProviderAction(formData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al guardar proveedor');
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
                        {provider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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

                    <form action={handleSubmit} id="provider-form">
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="name" style={labelStyle}>
                                <Building2 size={16} /> Nombre Fiscal / Comercial
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={provider?.name}
                                placeholder="Ej. AutoZone de México S.A. de C.V."
                                required
                                style={{ ...inputStyle, border: '1px solid #e5e7eb', backgroundColor: '#fff' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label htmlFor="tax_id" style={labelStyle}>
                                    <FileText size={16} /> RFC / Tax ID
                                </label>
                                <input
                                    type="text"
                                    id="tax_id"
                                    name="tax_id"
                                    defaultValue={provider?.tax_id}
                                    placeholder="AAA123456XYZ"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label htmlFor="contact_name" style={labelStyle}>
                                    <User size={16} /> Contacto Principal
                                </label>
                                <input
                                    type="text"
                                    id="contact_name"
                                    name="contact_name"
                                    defaultValue={provider?.contact_name}
                                    placeholder="Nombre del vendedor"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label htmlFor="email" style={labelStyle}>
                                    <Mail size={16} /> Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    defaultValue={provider?.email}
                                    placeholder="contacto@proveedor.com"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" style={labelStyle}>
                                    <Phone size={16} /> Teléfono
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    defaultValue={provider?.phone}
                                    placeholder="(55) 1234 5678"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="payment_terms" style={labelStyle}>
                                <CreditCard size={16} /> Condiciones de Pago
                            </label>
                            <select
                                id="payment_terms"
                                name="payment_terms"
                                defaultValue={provider?.payment_terms || 'Contado'}
                                style={inputStyle}
                            >
                                <option value="Contado">Contado (Inmediato)</option>
                                <option value="Net 7">Crédito 7 días</option>
                                <option value="Net 15">Crédito 15 días</option>
                                <option value="Net 30">Crédito 30 días</option>
                                <option value="Net 60">Crédito 60 días</option>
                            </select>
                        </div>

                        {provider && (
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    defaultChecked={provider.is_active}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: '#374151' }}>
                                    Proveedor Activo
                                </label>
                            </div>
                        )}
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
                        form="provider-form"
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#2563eb', // Blue-600
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
                        {loading ? 'Guardando...' : 'Guardar Proveedor'}
                    </button>
                </div>
            </div>
        </div>
    );
}
