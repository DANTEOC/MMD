'use client';

import { createServiceType, updateServiceType, toggleServiceType } from '@/app/actions/service-types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceTypeList({ initialServiceTypes }: { initialServiceTypes: any[] }) {
    const router = useRouter();
    const [newItemName, setNewItemName] = useState('');
    const [newItemDescription, setNewItemDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('name', newItemName);
            formData.append('description', newItemDescription);

            const result = await createServiceType(formData);
            if (result.success) {
                setNewItemName('');
                setNewItemDescription('');
                router.refresh();
            } else {
                setError(result.error || 'Error al crear');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle(id: string, currentState: boolean) {
        // Optimistic toggle could act here, but simple router refresh is safer
        const result = await toggleServiceType(id, currentState);
        if (result.success) {
            router.refresh();
        } else {
            alert('Error al cambiar estado: ' + result.error);
        }
    }

    async function startEdit(type: any) {
        setEditingId(type.id);
        setEditName(type.name);
        setEditDescription(type.description || '');
    }

    async function cancelEdit() {
        setEditingId(null);
        setEditName('');
        setEditDescription('');
    }

    async function saveEdit(id: string, currentIsActive: boolean) {
        const formData = new FormData();
        formData.append('name', editName);
        formData.append('description', editDescription);
        if (currentIsActive) formData.append('is_active', 'on');

        const result = await updateServiceType(id, formData);

        if (result.success) {
            setEditingId(null);
            router.refresh();
        } else {
            alert('Error al actualizar: ' + result.error);
        }
    }

    return (
        <div>
            {/* Create Form */}
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nombre del tipo de servicio (ej. Mantenimiento Correctivo)"
                        required
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !newItemName.trim()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading || !newItemName.trim() ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {loading ? 'Agregando...' : 'Agregar'}
                    </button>
                </div>
                <textarea
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Descripción del servicio (esto se verá en las cotizaciones)"
                    rows={2}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontFamily: 'inherit'
                    }}
                />
            </form>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* List */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                        <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' }}>Nombre</th>
                        <th style={{ textAlign: 'center', padding: '1rem', borderBottom: '1px solid #ddd' }}>Estado</th>
                        <th style={{ textAlign: 'right', padding: '1rem', borderBottom: '1px solid #ddd' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {initialServiceTypes.map((type) => (
                        <tr key={type.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '1rem' }}>
                                {editingId === type.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            style={{ padding: '0.5rem', width: '100%' }}
                                        />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Descripción"
                                            rows={2}
                                            style={{ padding: '0.5rem', width: '100%', fontFamily: 'inherit' }}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontWeight: 500, color: type.is_active ? 'inherit' : '#999' }}>{type.name}</div>
                                        {type.description && (
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>{type.description}</div>
                                        )}
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    backgroundColor: type.is_active ? '#e8f5e9' : '#ffebee',
                                    color: type.is_active ? '#2e7d32' : '#c62828',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {type.is_active ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    {editingId === type.id ? (
                                        <>
                                            <button
                                                onClick={() => saveEdit(type.id, type.is_active)}
                                                style={{ color: '#2e7d32', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Cancelar
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEdit(type)}
                                                style={{ color: '#2196f3', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleToggle(type.id, type.is_active)}
                                                style={{ color: type.is_active ? '#c62828' : '#2e7d32', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                {type.is_active ? 'Desactivar' : 'Activar'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {initialServiceTypes.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                                No hay tipos de servicio definidos. Agrega uno arriba.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
