'use client';

import { useState } from 'react';
import ConsumptionModal from './ConsumptionModal';
import { PackageMinus } from 'lucide-react';

export default function ConsumeMaterialButton({ workOrderId }: { workOrderId: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                title="Consumir Material (Salida de Almacén)"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    backgroundColor: '#e65100', color: 'white', border: 'none',
                    padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600
                }}
            >
                <PackageMinus size={16} /> Salida de Material
            </button>

            <ConsumptionModal
                workOrderId={workOrderId}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
