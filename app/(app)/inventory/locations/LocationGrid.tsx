'use client';

import { useState } from 'react';
import { Pencil, Warehouse, Truck, Globe } from 'lucide-react';
import EditLocationModal from './EditLocationModal';

export default function LocationGrid({ locations, canEdit }: { locations: any[], canEdit: boolean }) {
    const [editingLoc, setEditingLoc] = useState<any>(null);

    const getIcon = (type: string) => {
        switch (type) {
            case 'VEHICLE': return <Truck size={16} />;
            case 'EXTERNAL': return <Globe size={16} />;
            default: return <Warehouse size={16} />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'VEHICLE': return 'Vehículo';
            case 'EXTERNAL': return 'Externo';
            default: return 'Almacén';
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {locations.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#666', backgroundColor: 'white', borderRadius: '8px' }}>
                    No hay ubicaciones registradas
                </div>
            ) : (
                locations.map((loc: any) => (
                    <div key={loc.id} style={{
                        backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderLeft: loc.is_active ? '4px solid #4caf50' : '4px solid #f44336',
                        position: 'relative'
                    }}>
                        {canEdit && (
                            <button
                                onClick={() => setEditingLoc(loc)}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#666'
                                }}
                            >
                                <Pencil size={18} />
                            </button>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ color: '#666' }}>{getIcon(loc.type)}</div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{loc.name}</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                {getLabel(loc.type)}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: loc.is_active ? '#2e7d32' : '#c62828' }}>
                                {loc.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                ))
            )}

            {editingLoc && (
                <EditLocationModal
                    location={editingLoc}
                    onClose={() => setEditingLoc(null)}
                />
            )}
        </div>
    );
}
