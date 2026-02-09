'use client';

import { useState } from 'react';

export default function InviteUserForm({ tenantId }: { tenantId: string }) {
    const [email, setEmail] = useState('');
    const [roleKey, setRoleKey] = useState('Lectura');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/admin/invite-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Importante: enviar cookies de autenticación
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    role_key: roleKey,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al enviar invitación');
            }

            // Mostrar mensaje según delivery method
            const messageType = data.delivery === 'manual_link' ? 'warning' : 'success';
            let messageText = data.message || 'Invitación procesada';

            // Si es manual_link, agregar el link al mensaje
            if (data.delivery === 'manual_link' && data.invite_link) {
                messageText += `\n\nLink: ${data.invite_link}`;

                // Copiar automáticamente al portapapeles
                try {
                    await navigator.clipboard.writeText(data.invite_link);
                    messageText += '\n\n✓ Link copiado al portapapeles';
                } catch (e) {
                    // Silently fail if clipboard not available
                }
            }

            setMessage({
                type: messageType,
                text: messageText,
            });
            setEmail('');

            // Recargar la página para mostrar la nueva invitación
            setTimeout(() => window.location.reload(), 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Error al enviar invitación',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
        }}>
            <h2 style={{ marginTop: 0 }}>Invitar Usuario por Email</h2>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                El usuario recibirá un correo de Supabase con un link para aceptar la invitación.
            </p>


            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'success' ? '#e8f5e9' : message.type === 'warning' ? '#fff3e0' : '#ffebee',
                    color: message.type === 'success' ? '#2e7d32' : message.type === 'warning' ? '#e65100' : '#c62828',
                    border: `1px solid ${message.type === 'success' ? '#4caf50' : message.type === 'warning' ? '#ff9800' : '#f44336'}`
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="usuario@ejemplo.com"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor="role_key" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Rol
                        </label>
                        <select
                            id="role_key"
                            value={roleKey}
                            onChange={(e) => setRoleKey(e.target.value)}
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="Lectura">Lectura</option>
                            <option value="Tecnico">Técnico</option>
                            <option value="Operador">Operador</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: loading ? '#ccc' : '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {loading ? 'Enviando...' : 'Enviar Invitación'}
                    </button>
                </div>
            </form>
        </div>
    );
}
