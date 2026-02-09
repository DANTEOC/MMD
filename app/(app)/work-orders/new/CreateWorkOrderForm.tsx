'use client';

import { createWorkOrder } from '@/app/actions/work-orders';
import { getServiceTypes } from '@/app/actions/service-types';
import { getClients } from '@/app/actions/clients';
import { getAssets } from '@/app/actions/assets';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateWorkOrderForm({ initialMode = 'order' }: { initialMode?: 'quote' | 'order' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [status, setStatus] = useState(initialMode === 'quote' ? 'quote' : 'pending');

    // Force status update if mode changes (though component usually remounts)
    // We will use a hidden input "is_quote_mode" to force the server action to respect it.
    // Data handling
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [loadingAssets, setLoadingAssets] = useState(false);

    // Load clients and service types on mount
    useEffect(() => {
        getClients().then(setClients);
        getServiceTypes(true).then(setServiceTypes);
    }, []);

    // Load assets when client changes
    useEffect(() => {
        if (!selectedClientId) {
            setAssets([]);
            return;
        }

        setLoadingAssets(true);
        getAssets(selectedClientId)
            .then(setAssets)
            .finally(() => setLoadingAssets(false));
    }, [selectedClientId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        // Ensure status is correctly passed if action expects it from form, otherwise handled here or in action default
        // We will append it to formData implicitly via hidden input below

        try {
            const result = await createWorkOrder(formData);

            if (!result.success) {
                setError(result.error || 'Error desconocido');
            } else {
                router.push(`/work-orders/${result.id}`);
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        fontFamily: 'inherit',
        backgroundColor: 'white'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 500,
        color: '#666'
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Hidden Inputs */}
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="is_quote_mode" value={initialMode === 'quote' ? 'true' : 'false'} />

            {error && (
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    borderRadius: '4px',
                    marginBottom: '1rem'
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                    <label style={labelStyle}>
                        Cliente
                    </label>
                    <select
                        name="client_id"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        required
                        style={{
                            ...inputStyle,
                            fontWeight: 500,
                        }}
                    >
                        <option value="">-- Seleccionar Cliente --</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>
                        Activo/Embarcación
                    </label>
                    <select
                        name="asset_id"
                        disabled={!selectedClientId}
                        style={{
                            ...inputStyle,
                            fontWeight: 500,
                            backgroundColor: !selectedClientId ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">
                            {loadingAssets ? 'Cargando...' : '-- Seleccionar Activo (Opcional) --'}
                        </option>
                        {assets.map(asset => (
                            <option key={asset.id} value={asset.id}>
                                {asset.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Keep existing Status/Priority logic? Create implies Default status usually, priority selectable */}
                <div>
                    <label htmlFor="priority" style={labelStyle}>
                        Prioridad
                    </label>
                    <select
                        id="priority"
                        name="priority"
                        defaultValue="medium"
                        style={{
                            ...inputStyle,
                            fontWeight: 500,
                        }}
                    >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="service_type_id" style={labelStyle}>
                        Tipo de Servicio
                    </label>
                    <select
                        id="service_type_id"
                        name="service_type_id"
                        required
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="">-- Seleccionar Tipo --</option>
                        {serviceTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                    Título
                </label>
                <input
                    type="text"
                    name="title"
                    required
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem'
                    }}
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                    Descripción
                </label>
                <textarea
                    name="description"
                    rows={6}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                    }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Link
                    href="/work-orders"
                    style={{
                        padding: '0.75rem 1.5rem',
                        color: '#666',
                        textDecoration: 'none',
                        fontWeight: 500
                    }}
                >
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: initialMode === 'quote' ? '#ef6c00' : '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Procesando...' : (initialMode === 'quote' ? 'Crear Cotización' : 'Crear Orden')}
                </button>
            </div>
        </form>
    );
}
