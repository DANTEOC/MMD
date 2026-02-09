'use client';

import { resendInvite } from '@/app/actions/invites';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ResendInviteButton({ inviteId }: { inviteId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResend = async () => {
        if (!confirm('¿Deseas re-enviar esta invitación? Se enviará un nuevo email.')) {
            return;
        }

        setLoading(true);
        try {
            const result = await resendInvite(inviteId);

            if (!result.success) {
                alert(`Error: ${result.error}`);
                setLoading(false);
                return;
            }

            // Mostrar mensaje de éxito y recargar
            alert('¡Invitación re-enviada exitosamente!');
            window.location.reload();
        } catch (error: any) {
            alert(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleResend}
            disabled={loading}
            style={{
                padding: '0.5rem 1rem',
                backgroundColor: loading ? '#ccc' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginRight: '0.5rem',
            }}
        >
            {loading ? 'Enviando...' : 'Re-enviar'}
        </button>
    );
}
