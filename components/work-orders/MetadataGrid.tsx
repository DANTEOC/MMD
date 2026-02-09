'use client';

type MetadataGridProps = {
    workOrder: any;
    clients: any[];
    assets: any[];
    serviceTypes: any[];
    users: any[];
    isEditing: boolean;
    onChange?: (field: string, value: any) => void;
};

export default function MetadataGrid({
    workOrder,
    clients,
    assets,
    serviceTypes,
    users,
    isEditing,
    onChange
}: MetadataGridProps) {
    const priorityOptions = [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: 'Urgente' }
    ];

    const statusOptions = [
        { value: 'pending', label: 'Pendiente' },
        { value: 'in_progress', label: 'En Progreso' },
        { value: 'completed', label: 'Completado' },
        { value: 'cancelled', label: 'Cancelado' }
    ];

    return (
        <div style={{
            backgroundColor: '#f5f5f5',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
        }}>
            {/* First Row: Cliente, Activo, Estado, Prioridad */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                {/* Cliente */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Cliente
                    </label>
                    {isEditing ? (
                        <select
                            value={workOrder.client_id || ''}
                            onChange={(e) => onChange?.('client_id', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            <option key="default-client" value="">Seleccionar...</option>
                            {clients.map((client) => (
                                <option key={`client-${client.id}`} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {workOrder.client?.name || '-'}
                        </div>
                    )}
                </div>

                {/* Activo */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Activo
                    </label>
                    {isEditing ? (
                        <select
                            value={workOrder.asset_id || ''}
                            onChange={(e) => onChange?.('asset_id', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            <option key="default-asset" value="">Seleccionar...</option>
                            {assets.map((asset) => (
                                <option key={`asset-${asset.id}`} value={asset.id}>
                                    {asset.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {workOrder.asset?.name || '-'}
                        </div>
                    )}
                </div>

                {/* Estado */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Estado
                    </label>
                    {isEditing ? (
                        <select
                            value={workOrder.status}
                            onChange={(e) => onChange?.('status', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {statusOptions.find(s => s.value === workOrder.status)?.label || workOrder.status}
                        </div>
                    )}
                </div>

                {/* Prioridad */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Prioridad
                    </label>
                    {isEditing ? (
                        <select
                            value={workOrder.priority}
                            onChange={(e) => onChange?.('priority', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            {priorityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {priorityOptions.find(p => p.value === workOrder.priority)?.label || workOrder.priority}
                        </div>
                    )}
                </div>
            </div>

            {/* Second Row: Tipo de servicio, Asignado a, Título */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
            }}>
                {/* Tipo de servicio */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Tipo de servicio
                    </label>
                    {isEditing ? (
                        <select
                            value={workOrder.service_type_id || ''}
                            onChange={(e) => onChange?.('service_type_id', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            <option key="default-service" value="">Seleccionar...</option>
                            {serviceTypes.map((type) => (
                                <option key={`service-${type.id}`} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {workOrder.service_type?.name || '-'}
                        </div>
                    )}
                    {workOrder.service_type?.description && (
                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem', fontStyle: 'italic' }}>
                            {workOrder.service_type.description}
                        </div>
                    )}
                </div>

                {/* Asignado a */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Asignado a
                    </label>
                    {isEditing ? (
                        <select
                            value={workOrder.assigned_to || ''}
                            onChange={(e) => onChange?.('assigned_to', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            <option key="default-user" value="">Sin asignar</option>
                            {users.map((user) => (
                                <option key={`user-${user.user_id}`} value={user.user_id}>
                                    {user.profile?.full_name || user.profile?.email || 'Desconocido'}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {workOrder.assignee?.full_name || workOrder.assignee?.email || 'Sin asignar'}
                        </div>
                    )}
                </div>

                {/* Título de la cotización/orden */}
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#666' }}>
                        Título
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={workOrder.title}
                            onChange={(e) => onChange?.('title', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        />
                    ) : (
                        <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {workOrder.title}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
