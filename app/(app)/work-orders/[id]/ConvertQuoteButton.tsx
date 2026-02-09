'use client';

import { convertQuoteToOrder } from '@/app/actions/work-orders';
import { useState } from 'react';

export default function ConvertQuoteButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false);

    const handleConvert = async () => {
        if (!confirm('¿Convertir esta cotización en Orden de Trabajo? Se habilitará el consumo de inventario y la asignación.')) {
            return;
        }

        setLoading(true);
        const res = await convertQuoteToOrder(id);
        if (!res.success) {
            alert(res.error);
            setLoading(false);
        } else {
            // Refresh managed by server action revalidate, but we can reload to be safe
            window.location.reload();
        }
    };

    return (
        <button
            onClick={handleConvert}
            disabled={loading}
            style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#8bc34a', // Light Green
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '0.875rem'
            }}
        >
            {loading ? 'Convirtiendo...' : 'Convertir a Orden'}
        </button>
    );
}
