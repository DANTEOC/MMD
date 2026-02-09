'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRequests } from '@/app/actions/requests';
import { createClient } from '@/lib/supabase/client';

export default function PendingRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            const data = await getUserRequests();
            setRequests(data);
            setLoading(false);
        };

        loadRequests();
    }, [router]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            fontFamily: 'system-ui'
        }}>
            <div style={{
                maxWidth: '600px',
                width: '100%',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>Estado de Solicitudes</h1>

                {requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>No tienes solicitudes pendientes ni activas.</p>
                        <button
                            onClick={() => router.push('/request-access')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Solicitar Acceso
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(req => {
                            const statusColor =
                                req.status === 'approved' ? '#4caf50' :
                                    req.status === 'rejected' ? '#f44336' :
                                        '#ff9800';

                            const statusText =
                                req.status === 'approved' ? 'Aprobada' :
                                    req.status === 'rejected' ? 'Rechazada' :
                                        'Pendiente';

                            return (
                                <div key={req.id} style={{
                                    padding: '1rem',
                                    border: '1px solid #eee',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                                            {req.tenants?.name || 'Organización desconocida'}
                                        </h3>
                                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        backgroundColor: statusColor,
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}>
                                        {statusText}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Mostrar botón para ir al Dashboard si hay alguna aprobada */}
                        {requests.some(r => r.status === 'approved') && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#4caf50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Ir al Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <button
                            onClick={() => router.push('/request-access')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#2196f3',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                marginRight: '1rem'
                            }}
                        >
                            + Nueva Solicitud
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
