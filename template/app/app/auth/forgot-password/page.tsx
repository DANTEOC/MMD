'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        setLoading(false)

        if (error) {
            // Mejorar mensaje de rate limit
            if (error.message.includes('rate limit')) {
                setMessage({
                    type: 'error',
                    text: 'Has solicitado demasiados enlaces. Por favor, espera 60 segundos antes de intentar nuevamente o revisa tu bandeja de entrada por emails anteriores.',
                })
            } else {
                setMessage({ type: 'error', text: error.message })
            }
            return
        }

        setMessage({
            type: 'success',
            text: 'Revisa tu correo electrónico. Te hemos enviado un enlace para restablecer tu contraseña. El enlace expira en 1 hora.',
        })
        setEmail('')
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
                    ¿Olvidaste tu contraseña?
                </h1>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem', fontSize: '0.875rem' }}>
                    Ingresa tu email y te enviaremos un enlace para restablecerla.
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label
                            htmlFor="email"
                            style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            disabled={loading}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            marginBottom: '1.5rem',
                            backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
                            border: `1px solid ${message.type === 'error' ? '#ef5350' : '#4caf50'}`,
                            borderRadius: '4px',
                            color: message.type === 'error' ? '#c62828' : '#2e7d32',
                            fontSize: '0.875rem'
                        }}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: loading ? '#ccc' : '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginBottom: '1rem'
                        }}
                    >
                        {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <Link
                            href="/login"
                            style={{
                                color: '#2196f3',
                                textDecoration: 'none',
                                fontSize: '0.875rem'
                            }}
                        >
                            ← Volver al login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
