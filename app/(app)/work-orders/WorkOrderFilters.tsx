'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function WorkOrderFilters({
    currentFilters,
    role,
    serviceTypes = []
}: {
    currentFilters: { status: string; priority: string; assigned_to: string; service_type?: string },
    role: string,
    serviceTypes?: any[]
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    function handleFilterChange(key: string, value: string) {
        const params = new URLSearchParams(searchParams);
        if (value === 'all') {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.replace(`?${params.toString()}`);
    }

    return (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
            {/* Status Filter */}
            <select
                defaultValue={searchParams.get('status') || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '0.875rem'
                }}
            >
                <option value="all">Estado: Todos</option>
                <option value="quote">Cotización</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
            </select>

            {/* Priority Filter */}
            <select
                defaultValue={searchParams.get('priority') || 'all'}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '0.875rem'
                }}
            >
                <option value="all">Prioridad: Todas</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
            </select>

            {/* Service Type Filter */}
            <select
                defaultValue={searchParams.get('service_type') || 'all'}
                onChange={(e) => handleFilterChange('service_type', e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                    maxWidth: '200px'
                }}
            >
                <option value="all">Tipo de Servicio: Todos</option>
                {serviceTypes.map(type => (
                    <option key={type.id} value={type.id}>
                        {type.name}
                    </option>
                ))}
            </select>

            {/* Assigned Filter */}
            <select
                defaultValue={searchParams.get('assigned_to') || 'all'}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '0.875rem'
                }}
            >
                <option value="all">Asignado: Todos</option>
                <option value="me">Mis Órdenes</option>
            </select>

            {/* Client Search */}
            <input
                type="text"
                placeholder="Buscar Cliente..."
                defaultValue={searchParams.get('client_query') || ''}
                onBlur={(e) => handleFilterChange('client_query', e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleFilterChange('client_query', (e.target as HTMLInputElement).value);
                    }
                }}
                style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                    width: '150px'
                }}
            />

            {/* Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0 0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Desde:</span>
                <input
                    type="date"
                    defaultValue={searchParams.get('date_from') || ''}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    style={{
                        padding: '0.4rem',
                        border: 'none',
                        fontSize: '0.875rem',
                        outline: 'none'
                    }}
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0 0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#666' }}>Hasta:</span>
                <input
                    type="date"
                    defaultValue={searchParams.get('date_to') || ''}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    style={{
                        padding: '0.4rem',
                        border: 'none',
                        fontSize: '0.875rem',
                        outline: 'none'
                    }}
                />
            </div>

            {(searchParams.get('status') || searchParams.get('priority') || searchParams.get('assigned_to') || searchParams.get('service_type')) && (
                <button
                    onClick={() => router.replace('/work-orders')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        color: '#666'
                    }}
                >
                    Limpiar Filtros
                </button>
            )}
        </div>
    );
}
