'use client';

import { useState } from 'react';
import { createSupplier } from '@/app/actions/suppliers';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export default function CreateSupplierButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await createSupplier(formData);
            if (!result.success) {
                alert(result.error);
            } else {
                setIsOpen(false);
                router.refresh();
            }
        } catch (error) {
            alert('Error creating supplier');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: '#1976d2', color: 'white', border: 'none',
                    padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500
                }}
            >
                <Plus size={18} /> Nuevo Proveedor
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '450px', maxWidth: '90%'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Nuevo Proveedor</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Nombre / Razón Social *</label>
                                <input name="name" required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>RFC / Tax ID</label>
                                <input name="tax_id" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Información de Contacto</label>
                                <textarea
                                    name="contact_info"
                                    rows={3}
                                    placeholder="Teléfono, Email, Dirección, Persona de Contacto..."
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} style={{ padding: '0.6rem 1rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={loading} style={{ padding: '0.6rem 1rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
