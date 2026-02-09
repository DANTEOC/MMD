'use client';

import { useState } from 'react';
import { PackageX } from 'lucide-react';
import ReturnMaterialModal from './ReturnMaterialModal';

export default function ReturnMaterialButton({ workOrderId }: { workOrderId: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Devolver Material (Reingreso a Almacén)"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    backgroundColor: 'white', color: '#e65100', border: '1px solid #e65100',
                    padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600
                }}
            >
                <PackageX size={16} /> Devolver
            </button>

            <ReturnMaterialModal
                workOrderId={workOrderId}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
