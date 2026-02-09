'use client';

import { useState } from 'react';
import { toggleItemStatus, type CatalogItem } from '@/app/actions/inventory';
import { Power, Trash2 } from 'lucide-react';

export default function ItemActions({ item }: { item: CatalogItem }) {
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        if (!confirm(`¿Estás seguro de que deseas ${item.is_active ? 'suspender' : 'activar'} este item?`)) return;

        setLoading(true);
        try {
            const result = await toggleItemStatus(item.id, !item.is_active);
            if (!result.success) {
                alert(result.error);
            }
        } catch (error) {
            alert('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Edit is handled by parent or separate component, but here we focus on Status */}
            <button
                onClick={handleToggle}
                disabled={loading}
                style={{
                    color: item.is_active ? '#dc2626' : '#16a34a',
                    padding: '0.25rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: loading ? 0.5 : 1
                }}
                title={item.is_active ? "Suspender (Eliminar)" : "Reactivar"}
            >
                {item.is_active ? <Trash2 size={18} /> : <Power size={18} />}
            </button>
        </div>
    );
}
