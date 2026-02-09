'use client';

import { useState } from 'react';
import { updateSupplier, toggleSupplierStatus, Supplier } from '@/app/actions/suppliers';
import { useRouter } from 'next/navigation';
import { Edit2, Power, MoreVertical } from 'lucide-react';

export default function SupplierActions({ supplier }: { supplier: Supplier }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await updateSupplier(supplier.id, formData);
            if (!result.success) {
                alert(result.error);
            } else {
                setIsEditOpen(false);
                router.refresh();
            }
        } catch (error) {
            alert('Error updating supplier');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        const action = supplier.is_active ? 'suspender' : 'activar';
        if (!confirm(`¿Estás seguro de que deseas ${action} a este proveedor?`)) return;

        setLoading(true);
        try {
            const result = await toggleSupplierStatus(supplier.id, !supplier.is_active);
            if (!result.success) {
                alert(result.error);
            } else {
                router.refresh();
            }
        } catch (error) {
            alert('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
                onClick={() => setIsEditOpen(true)}
                title="Editar"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#1976d2', padding: '4px'
                }}
            >
                <Edit2 size={18} />
            </button>
            <button
                onClick={handleToggle}
                title={supplier.is_active ? 'Suspender' : 'Activar'}
                disabled={loading}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: supplier.is_active ? '#d32f2f' : '#2e7d32', padding: '4px'
                }}
            >
                <Power size={18} />
            </button>

            {isEditOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '450px', maxWidth: '90%'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Editar Proveedor</h2>
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Nombre / Razón Social *</label>
                                <input name="name" defaultValue={supplier.name} required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>RFC / Tax ID</label>
                                <input name="tax_id" defaultValue={supplier.tax_id || ''} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Información de Contacto</label>
                                <textarea
                                    name="contact_info"
                                    defaultValue={supplier.contact_info || ''}
                                    rows={3}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsEditOpen(false)} style={{ padding: '0.6rem 1rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={loading} style={{ padding: '0.6rem 1rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
