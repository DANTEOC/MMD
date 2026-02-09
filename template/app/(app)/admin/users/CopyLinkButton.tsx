'use client';

import { useState } from 'react';

export default function CopyLinkButton({ inviteId }: { inviteId: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/auth/accept-invite?invite_id=${inviteId}`;

        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            // Fallback para navegadores antiguos
            const input = document.createElement('input');
            input.value = link;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <button
            onClick={handleCopyLink}
            style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: copied ? '#4caf50' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background-color 0.2s'
            }}
            title="Copiar link de invitación para compartir manualmente"
        >
            {copied ? '✓ Copiado' : '📋 Copiar Link'}
        </button>
    );
}
