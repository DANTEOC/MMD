'use client';

import { useState } from 'react';
import { decideJoinRequest } from '@/app/actions/requests';

export default function RequestItem({ request }: { request: any }) {
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState('Lectura');
    const [showRoleSelect, setShowRoleSelect] = useState(false);

    const handleDecide = async (decision: 'approved' | 'rejected') => {
        if (decision === 'approved' && !showRoleSelect) {
            setShowRoleSelect(true);
            return;
        }

        if (!confirm(`¿Estás seguro de que deseas ${decision === 'approved' ? 'aprobar' : 'rechazar'} esta solicitud?`)) {
            return;
        }

        setLoading(true);
        try {
            const result = await decideJoinRequest(request.id, decision, selectedRole);

            if (!result.success) {
                alert(`Error: ${result.error}`);
            } else {
                // Success - revalidatePath will refresh the list (removing this item)
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '1rem',
            border: '1px solid #eee',
            borderRadius: '8px',
            backgroundColor: 'white',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                    User ID: <span style={{ fontFamily: 'monospace' }}>{request.user_id}</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    Solicitado: {new Date(request.created_at).toLocaleString()}
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#fff3e0',
                        color: '#ef6c00',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                    }}>
                        Pendiente
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {showRoleSelect && (
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={loading}
                        style={{
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                        }}
                    >
                        <option value="Lectura">Lectura</option>
                        <option value="Tecnico">Técnico</option>
                        <option value="Operador">Operador</option>
                        <option value="Admin">Admin</option>
                    </select>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {showRoleSelect ? (
                        <>
                            <button
                                onClick={() => handleDecide('approved')}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? '...' : 'Confirmar'}
                            </button>
                            <button
                                onClick={() => setShowRoleSelect(false)}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#9e9e9e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => handleDecide('approved')}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Aprobar
                            </button>
                            <button
                                onClick={() => handleDecide('rejected')}
                                disabled={loading}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Rechazar
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
