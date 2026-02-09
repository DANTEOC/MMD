'use client';

import { getWorkOrderEvents } from '@/app/actions/work-orders';
import { useEffect, useState } from 'react';

export default function WorkOrderHistory({ workOrderId }: { workOrderId: string }) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getWorkOrderEvents(workOrderId).then(data => {
            setEvents(data);
            setLoading(false);
        });
    }, [workOrderId]);

    if (loading) {
        return <div style={{ padding: '1rem', color: '#666' }}>Cargando historial...</div>;
    }

    if (events.length === 0) {
        return <div style={{ padding: '1rem', color: '#666', fontStyle: 'italic' }}>Sin eventos registrados.</div>;
    }

    function formatEvent(event: any, index: number) {
        // ... (date/content login unchanged)
        const date = new Date(event.created_at).toLocaleString('es-MX', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const user = event.performer?.full_name || event.performer?.email || 'Usuario';

        let content = '';
        switch (event.event_type) {
            case 'created': content = 'Orden Creada'; break;
            case 'status_changed': content = `Cambio de Estado: ${event.old_value?.status} ➝ ${event.new_value?.status}`; break;
            case 'priority_changed': content = `Cambio de Prioridad: ${event.old_value?.priority} ➝ ${event.new_value?.priority}`; break;
            case 'technician_changed': content = 'Reasignación de Técnico'; break;
            case 'note_added': content = 'Nota agregada'; break;
            default: content = event.event_type;
        }

        return (
            <div key={`event-${event.id || index}`} style={{
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid #eee',
                display: 'flex',
                gap: '1rem'
            }}>
                <div style={{ minWidth: '120px', fontSize: '0.85rem', color: '#666' }}>
                    {date}
                </div>
                <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        {user}
                    </div>
                    <div style={{ color: '#333' }}>
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', marginTop: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.2rem', color: '#333' }}>Historial de Actividad</h3>
            <div>
                {events.map((event, i) => formatEvent(event, i))}
            </div>
        </div>
    );
}
