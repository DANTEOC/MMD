'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth_required'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const acceptInvite = async () => {
            try {
                const supabase = createClient();

                // Esperar un momento para que la sesión se establezca
                // (Supabase puede estar procesando el token de la URL)
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Verificar si hay sesión autenticada
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Error al obtener sesión:', sessionError);
                    setStatus('error');
                    setMessage('Error al verificar autenticación. Por favor, intenta nuevamente.');
                    return;
                }

                if (!session) {
                    // Si no hay sesión, mostrar pantalla de "Paso requerido"
                    setStatus('auth_required');
                    return;
                }

                // Obtener invite_id de la URL
                const inviteId = searchParams.get('invite_id');

                if (!inviteId) {
                    setStatus('error');
                    setMessage('Invitación inválida: falta invite_id. Por favor, usa el link completo de la invitación.');
                    return;
                }

                // Buscar la invitación por ID para obtener el tenant_id
                const { data: invite, error: inviteError } = await supabase
                    .from('tenant_invites')
                    .select('id, tenant_id, email, role_key, status')
                    .eq('id', inviteId)
                    .single();

                if (inviteError || !invite) {
                    console.error('Error al buscar invitación:', inviteError);
                    setStatus('error');
                    setMessage('Invitación no encontrada o inválida.');
                    return;
                }

                // Verificar que la invitación esté pendiente
                if (invite.status !== 'pending') {
                    setStatus('error');
                    setMessage(`Esta invitación ya fue ${invite.status === 'accepted' ? 'aceptada' : 'revocada'}.`);
                    return;
                }

                // Llamar a la función RPC para aceptar la invitación
                const { data, error } = await supabase
                    .rpc('api_accept_invite', { p_tenant_id: invite.tenant_id });

                if (error) {
                    console.error('Error al aceptar invitación:', error);
                    setStatus('error');
                    setMessage(`Error: ${error.message}`);
                    return;
                }

                if (!data || !data.success) {
                    setStatus('error');
                    setMessage(data?.error || 'Error desconocido al aceptar invitación');
                    return;
                }

                // Éxito
                setStatus('success');
                setMessage(`¡Invitación aceptada! Ahora eres miembro del tenant con rol: ${data.role}`);

                // Redirigir al dashboard después de 2 segundos
                setTimeout(() => router.push('/dashboard'), 2000);

            } catch (error: any) {
                console.error('Error inesperado:', error);
                setStatus('error');
                setMessage(`Error inesperado: ${error.message}`);
            }
        };

        acceptInvite();
    }, [searchParams, router]);

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
                maxWidth: '500px',
                width: '100%',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                textAlign: 'center'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '4px solid #e0e0e0',
                            borderTop: '4px solid #2196f3',
                            borderRadius: '50%',
                            margin: '0 auto 1.5rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <h1 style={{ marginBottom: '1rem', color: '#333' }}>Procesando invitación...</h1>
                        <p style={{ color: '#666' }}>Por favor espera mientras verificamos tu invitación.</p>
                    </>
                )}

                {status === 'auth_required' && (
                    <>
                        <div style={{
                            fontSize: '3rem',
                            marginBottom: '1rem',
                        }}>
                            🟡
                        </div>
                        <h1 style={{ marginBottom: '1.5rem', color: '#f57f17' }}>Paso requerido</h1>
                        <div style={{ textAlign: 'left', marginBottom: '2rem', color: '#333', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '1rem' }}>Esta invitación es válida, pero antes debes:</p>
                            <ol style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
                                <li>Confirmar tu email (revisa tu bandeja de entrada)</li>
                                <li>Crear tu contraseña</li>
                                <li>Iniciar sesión</li>
                            </ol>
                            <p><strong>Después, vuelve a abrir este mismo enlace para aceptar la invitación.</strong></p>
                        </div>
                        <a
                            href="/login"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: 500
                            }}
                        >
                            Ir a Login
                        </a>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#4caf50',
                            borderRadius: '50%',
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            color: 'white'
                        }}>
                            ✓
                        </div>
                        <h1 style={{ marginBottom: '1rem', color: '#4caf50' }}>¡Éxito!</h1>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>{message}</p>
                        <p style={{ color: '#999', fontSize: '0.875rem' }}>Redirigiendo al dashboard...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: '#f44336',
                            borderRadius: '50%',
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            color: 'white'
                        }}>
                            ✗
                        </div>
                        <h1 style={{ marginBottom: '1rem', color: '#f44336' }}>Atención</h1>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{message}</p>
                        <a
                            href="/login"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            Ir a Login
                        </a>
                    </>
                )}

                <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        </div>
    );
}
