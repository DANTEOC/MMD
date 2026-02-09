'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
    const router = useRouter()
    const supabase = createClient()

    const [ready, setReady] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const handleAuthChange = async () => {
            try {
                // Verificar si hay errores en la URL
                const urlParams = new URLSearchParams(window.location.search)
                const errorCode = urlParams.get('error_code')

                if (errorCode === 'otp_expired') {
                    setError('El enlace de recuperación ha expirado. Los enlaces solo son válidos por 5-10 minutos. Por favor, solicita uno nuevo.')
                    setReady(true)
                    return
                }

                // Esperar un momento para que Supabase procese el hash
                await new Promise(resolve => setTimeout(resolve, 100))

                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    setError('Enlace de recuperación inválido o expirado. Por favor, solicita uno nuevo.')
                }

                setReady(true)
            } catch (err) {
                console.error('Error checking session:', err)
                setError('Error al procesar el enlace de recuperación.')
                setReady(true)
            }
        }

        handleAuthChange()

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setError(null)
                setReady(true)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres')
            return
        }

        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            setError(updateError.message)
            return
        }

        setSuccess(true)
        setTimeout(() => {
            router.push('/login')
        }, 2000)
    }

    if (!ready) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: 'system-ui'
            }}>
                <p>Validando enlace...</p>
            </div>
        )
    }

    if (success) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                fontFamily: 'system-ui',
                backgroundColor: '#f5f5f5'
            }}>
                <div style={{
                    padding: '2rem',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h2 style={{ color: '#4caf50', marginBottom: '1rem' }}>¡Contraseña actualizada!</h2>
                    <p>Redirigiendo al login...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginTop: 0, marginBottom: '0.5rem', textAlign: 'center' }}>
                    Restablecer Contraseña
                </h1>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem', fontSize: '0.875rem' }}>
                    Ingresa tu nueva contraseña
                </p>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1.5rem',
                        backgroundColor: '#ffebee',
                        border: '1px solid #ef5350',
                        borderRadius: '4px',
                        color: '#c62828',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label
                            htmlFor="password"
                            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
                        >
                            Nueva Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={!!error}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Mínimo 8 caracteres"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label
                            htmlFor="confirmPassword"
                            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
                        >
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            disabled={!!error}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                            placeholder="Repite la contraseña"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!!error}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: error ? '#ccc' : '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: error ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Guardar Contraseña
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <a
                        href="/auth/forgot-password"
                        style={{
                            color: '#2196f3',
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                        }}
                    >
                        Solicitar nuevo enlace
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
