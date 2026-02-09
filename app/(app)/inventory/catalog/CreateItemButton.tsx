'use client';

import { useState } from 'react';
import { createItem } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';

export default function CreateItemButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await createItem(formData);
            if (!result.success) {
                alert(result.error);
            } else {
                setIsOpen(false);
                router.refresh();
            }
        } catch (error) {
            alert('Error creating item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 500
                }}
            >
                + Nuevo Item
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px', maxWidth: '90%'
                    }}>
                        <h2 style={{ marginTop: 0 }}>Nuevo Item</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Nombre</label>
                                <input name="name" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Tipo</label>
                                    <select name="kind" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                                        <option value="PRODUCT">Producto</option>
                                        <option value="SERVICE">Servicio</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Unidad</label>
                                    <select name="unit" defaultValue="pieza" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
                                        <option value="pieza">Pieza</option>
                                        <option value="hora">Hora</option>
                                        <option value="dia">Día</option>
                                        <option value="servicio">Servicio</option>
                                        <option value="litro">Litro</option>
                                        <option value="kg">Kg</option>
                                        <option value="gramo">Gramo</option>
                                        <option value="galon">Galón</option>
                                        <option value="metro">Metro</option>
                                        <option value="cm">Cm</option>
                                        <option value="kit">Kit</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Stock Mínimo</label>
                                <input name="min_stock" type="number" defaultValue="0" min="0" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Descripción</label>
                                <textarea name="description" rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsOpen(false)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
