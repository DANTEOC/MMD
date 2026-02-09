'use client';

import { deleteInvite } from '@/app/actions/invites';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RevokeInviteButton({ inviteId }: { inviteId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas revocar esta invitación?')) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteInvite(inviteId);

            console.log('Revoke result:', result);

            if (!result.success) {
                alert(`Error: ${result.error}`);
                setLoading(false);
                return;
            }

            // Mostrar mensaje de éxito
            alert('¡Invitación revocada exitosamente!');

            // Forzar recarga completa de la página con un pequeño delay
            console.log('Reloading page...');
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error: any) {
            console.error('Error in handleDelete:', error);
            alert(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
            }}
        >
            {loading ? 'Revocando...' : 'Revocar'}
        </button>
    );
}
