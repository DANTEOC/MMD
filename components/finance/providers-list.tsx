'use client';

import { useState } from 'react';
import { Provider } from '@/app/actions/providers';
import ProviderForm from './provider-form';
import { Edit, Phone, Mail, Building2, User, FileText } from 'lucide-react';

interface ProvidersListProps {
    providers: Provider[];
    role: string;
}

export default function ProvidersList({ providers, role }: ProvidersListProps) {
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
    const [showForm, setShowForm] = useState(false);

    const canManage = ['Admin', 'Supervisor', 'Contador'].includes(role);

    const handleEdit = (provider: Provider) => {
        setEditingProvider(provider);
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingProvider(null);
        setShowForm(true);
    };

    const handleSuccess = () => {
        setShowForm(false);
        setEditingProvider(null);
        // Page triggers revalidatePath logic, so we might reload or rely on Next.js default behavior
        // Since revalidatePath is server-side, client might not reflect immediately without router.refresh()
        // But let's assume standard behavior for now. 
        // Ideally we call router.refresh() here, but I need useRouter.
        window.location.reload();
    };

    return (
        <div>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                {canManage && (
                    <button
                        onClick={handleCreate}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            transition: 'all 0.2s'
                        }}
                    >
                        + Nuevo Proveedor
                    </button>
                )}
            </div>

            {/* Empty State */}
            {providers.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px dashed #e5e7eb',
                    color: '#6b7280'
                }}>
                    <Building2 size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        No hay proveedores registrados
                    </h3>
                    <p style={{ maxWidth: '400px', margin: '0 auto' }}>
                        Registra a tus proveedores para gestionar compras y gastos de manera organizada.
                    </p>
                </div>
            ) : (
                /* Grid Layout */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {providers.map((provider) => (
                        <div key={provider.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #f3f4f6',
                            padding: '1.5rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                            position: 'relative',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'default'
                        }}>
                            {/* Top Pattern Decorator */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '6px',
                                borderTopLeftRadius: '12px',
                                borderTopRightRadius: '12px',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)'
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                                        {provider.name}
                                    </h3>
                                    {provider.tax_id && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                            <FileText size={12} />
                                            {provider.tax_id}
                                        </div>
                                    )}
                                </div>
                                {canManage && (
                                    <button
                                        onClick={() => handleEdit(provider)}
                                        style={{
                                            padding: '0.4rem',
                                            borderRadius: '6px',
                                            border: '1px solid #e5e7eb',
                                            backgroundColor: '#f9fafb',
                                            color: '#6b7280',
                                            cursor: 'pointer'
                                        }}
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {provider.contact_name && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                        <User size={16} style={{ color: '#9ca3af' }} />
                                        <span>{provider.contact_name}</span>
                                    </div>
                                )}
                                {provider.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                        <Mail size={16} style={{ color: '#9ca3af' }} />
                                        <a href={`mailto:${provider.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                            {provider.email}
                                        </a>
                                    </div>
                                )}
                                {provider.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                        <Phone size={16} style={{ color: '#9ca3af' }} />
                                        <span>{provider.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer Status */}
                            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '999px',
                                    backgroundColor: provider.is_active ? '#ecfdf5' : '#fef2f2',
                                    color: provider.is_active ? '#059669' : '#dc2626',
                                    fontWeight: 600,
                                    border: `1px solid ${provider.is_active ? '#a7f3d0' : '#fecaca'}`
                                }}>
                                    {provider.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                    {provider.payment_terms || 'Contado'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <ProviderForm
                    provider={editingProvider || undefined}
                    onClose={() => setShowForm(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
