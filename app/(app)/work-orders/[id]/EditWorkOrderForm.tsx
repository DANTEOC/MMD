'use client';

import { updateWorkOrder } from '@/app/actions/work-orders';
import { getServiceTypes } from '@/app/actions/service-types';
import { getClients } from '@/app/actions/clients';
import { getAssets } from '@/app/actions/assets';
import { getTenantUsers } from '@/app/actions/users';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditWorkOrderForm({ workOrder, role }: { workOrder: any, role: string }) {
    const router = useRouter();
    const isTechnician = role === 'Tecnico';

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Client/Asset logic
    const [clients, setClients] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);
    const [tenantUsers, setTenantUsers] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(workOrder.client_id || '');
    const [selectedAssetId, setSelectedAssetId] = useState<string>(workOrder.asset_id || '');
    const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>(workOrder.service_type_id || '');
    const [selectedAssignedTo, setSelectedAssignedTo] = useState<string>(workOrder.assigned_to || '');
    const [loadingAssets, setLoadingAssets] = useState(false);

    // ... (rest of logic)

    useEffect(() => {
        getClients().then(setClients);
        // Load all service types (active or not? Edit might need inactive if previously selected, but usually we only show active for changing. 
        // If current value is inactive, it might not be in the list if we only fetch active. 
        // Best practice: Fetch all, disable inactive ones? Or just fetch all. 
        // Requirement says "all + lista de activos" for filter, but for Form usually active.
        // Let's fetch ALL but maybe visually indicate inactive? Simpler: Fetch active only for new selection.
        // BUT if I am editing an old order with a now-inactive type, I want to see the name.
        // The simple `getServiceTypes(false)` fetches ALL. I'll use that so we don't break display of old types.
        getServiceTypes(false).then(setServiceTypes);
        getTenantUsers().then(setTenantUsers);
    }, []);

    useEffect(() => {
        if (!selectedClientId) {
            setAssets([]);
            return;
        }
        setLoadingAssets(true);
        getAssets(selectedClientId).then(setAssets).finally(() => setLoadingAssets(false));
    }, [selectedClientId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await updateWorkOrder(workOrder.id, formData);

            if (!result.success) {
                setError(result.error || 'Error desconocido');
            } else {
                setSuccess('Orden actualizada correctamente');
                // Redirigir a la lista después de un breve delay
                setTimeout(() => {
                    router.push('/work-orders');
                }, 500);
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
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

            <div style={{
                padding: '1rem',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                marginBottom: '1rem'
            }}>
                {success}
            </div>


            {/* Client & Asset Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                        Cliente
                    </label>
                    <select
                        name="client_id"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        disabled={isTechnician}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: isTechnician ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">-- Sin asignar --</option>
                        {clients.map((client, i) => (
                            <option key={`client-${client.id || i}`} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                    {isTechnician && <input type="hidden" name="client_id" value={selectedClientId} />}
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                        Activo
                    </label>
                    <select
                        name="asset_id"
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        disabled={isTechnician || !selectedClientId}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: (isTechnician || !selectedClientId) ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">
                            {loadingAssets ? 'Cargando...' : '-- Sin activo --'}
                        </option>
                        {assets.map((asset, i) => (
                            <option key={`asset-${asset.id || i}`} value={asset.id}>
                                {asset.name}
                            </option>
                        ))}
                    </select>
                    {isTechnician && <input type="hidden" name="asset_id" value={selectedAssetId} />}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                        Estado
                    </label>
                    <select
                        name="status"
                        defaultValue={workOrder.status}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500
                        }}
                    >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                        Prioridad
                    </label>
                    <select
                        name="priority"
                        defaultValue={workOrder.priority}
                        disabled={isTechnician}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: isTechnician ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                    </select>
                    {isTechnician && <input type="hidden" name="priority" value={workOrder.priority} />}
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                        Tipo de Servicio
                    </label>
                    <select
                        name="service_type_id"
                        value={selectedServiceTypeId}
                        onChange={(e) => setSelectedServiceTypeId(e.target.value)}
                        disabled={isTechnician}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: isTechnician ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">-- Seleccionar Tipo --</option>
                        {serviceTypes.map((type, i) => (
                            <option key={`svc-${type.id || i}`} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                    {isTechnician && <input type="hidden" name="service_type_id" value={selectedServiceTypeId} />}
                </div>

                {/* Asignado a */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                        Asignado a
                    </label>
                    <select
                        name="assigned_to"
                        value={selectedAssignedTo}
                        onChange={(e) => setSelectedAssignedTo(e.target.value)}
                        disabled={isTechnician}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontWeight: 500,
                            backgroundColor: isTechnician ? '#f5f5f5' : 'white'
                        }}
                    >
                        <option value="">-- Sin asignar --</option>
                        {tenantUsers.map((user: any, i: number) => (
                            <option key={`user-${user.user_id || i}`} value={user.user_id}>
                                {user.profile?.full_name || user.profile?.email} ({user.role_key})
                            </option>
                        ))}
                    </select>
                    {isTechnician && <input type="hidden" name="assigned_to" value={selectedAssignedTo} />}
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                    Título
                </label>
                <input
                    type="text"
                    name="title"
                    defaultValue={workOrder.title}
                    required
                    readOnly={isTechnician}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '1rem',
                        backgroundColor: isTechnician ? '#f5f5f5' : 'white'
                    }}
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                    Descripción
                </label>
                <textarea
                    name="description"
                    defaultValue={workOrder.description || ''}
                    rows={6}
                    readOnly={isTechnician}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        lineHeight: '1.5',
                        backgroundColor: isTechnician ? '#f5f5f5' : 'white'
                    }}
                />
            </div>

            <div style={{
                padding: '1rem',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                marginBottom: '2rem',
                fontSize: '0.875rem',
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <div>
                    <strong>Creado por:</strong> {workOrder.creator?.full_name || workOrder.creator?.email || 'Sistema'}
                </div>
                <div>
                    <strong>Fecha:</strong> {new Date(workOrder.created_at).toLocaleString()}
                </div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form >
    );
}
