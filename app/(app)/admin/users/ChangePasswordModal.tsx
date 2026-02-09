'use client';

import { useState } from 'react';
import { resetUserPassword } from '@/app/actions/users';

type ChangePasswordModalProps = {
    userId: string;
    userName: string;
    onClose: () => void;
    onSuccess: () => void;
};

export default function ChangePasswordModal({ userId, userName, onClose, onSuccess }: ChangePasswordModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
        }

        const result = await resetUserPassword(userId, password);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginTop: 0 }}>Cambiar Contraseña</h2>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>Usuario: <strong>{userName}</strong></p>

                {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Nueva Contraseña</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', border: 'none', background: '#eee', cursor: 'pointer', borderRadius: '4px' }}>Cancelar</button>
                        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', border: 'none', background: '#f44336', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>
                            {loading ? 'Guardando...' : 'Cambiar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
