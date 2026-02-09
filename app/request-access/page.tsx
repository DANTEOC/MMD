'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAvailableTenants, createJoinRequest } from '@/app/actions/requests';
import { createClient } from '@/lib/supabase/client';

export default function RequestAccessPage() {
    const router = useRouter();
    const [tenants, setTenants] = useState<any[]>([]);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuthAndLoad = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/login');
                return;
            }

            try {
                const availableTenants = await getAvailableTenants();
                setTenants(availableTenants);
            } catch (err) {
                console.error('Error loading tenants:', err);
                setError('Error al cargar la lista de organizaciones');
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndLoad();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        setSubmitting(true);
        setError(null);

        try {
            const result = await createJoinRequest(selectedTenant);

            if (!result.success) {
                setError(result.error);
                setSubmitting(false);
                return;
            }

            router.push('/pending');
        } catch (err: any) {
            setError(err.message || 'Error al enviar solicitud');
            setSubmitting(false);
        }
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
                maxWidth: '450px',
                width: '100%',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333' }}>Solicitar Acceso</h1>
                <p style={{ marginBottom: '1.5rem', color: '#666', textAlign: 'center' }}>
                    Selecciona una organización para unirte.
                </p>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="tenant" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                            Organización
                        </label>
                        <select
                            id="tenant"
                            value={selectedTenant}
                            onChange={(e) => setSelectedTenant(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Selecciona una opción...</option>
                            {tenants.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !selectedTenant}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 600,
                            cursor: (submitting || !selectedTenant) ? 'not-allowed' : 'pointer',
                            opacity: (submitting || !selectedTenant) ? 0.7 : 1
                        }}
                    >
                        {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Volver al Login
                    </button>
                </div>
            </div>
        </div>
    );
}
