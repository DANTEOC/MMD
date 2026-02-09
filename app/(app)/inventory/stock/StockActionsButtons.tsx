'use client';

import { useState } from 'react';
import MovementModal from './MovementModal';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightCircle } from 'lucide-react';

export default function StockActionsButtons({ roleKey }: { roleKey: string }) {
    const [modalType, setModalType] = useState<'IN' | 'OUT' | 'TRANSFER' | null>(null);

    const canIn = ['Admin', 'Supervisor'].includes(roleKey);
    const canOut = ['Admin', 'Supervisor', 'Tecnico'].includes(roleKey);
    const canTransfer = ['Admin', 'Supervisor', 'Tecnico'].includes(roleKey);

    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canIn && (
                <button
                    onClick={() => setModalType('IN')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', backgroundColor: '#4caf50', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem'
                    }}
                >
                    <ArrowDownCircle size={18} /> Entrada
                </button>
            )}

            {canOut && (
                <button
                    onClick={() => setModalType('OUT')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', backgroundColor: '#f44336', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem'
                    }}
                >
                    <ArrowUpCircle size={18} /> Salida
                </button>
            )}

            {canTransfer && (
                <button
                    onClick={() => setModalType('TRANSFER')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 1rem', backgroundColor: '#2196f3', color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem'
                    }}
                >
                    <ArrowRightCircle size={18} /> Transferencia
                </button>
            )}

            {/* Modals */}
            <MovementModal
                isOpen={modalType === 'IN'}
                onClose={() => setModalType(null)}
                type="IN"
                title="Registrar Entrada de Inventario"
            />
            <MovementModal
                isOpen={modalType === 'OUT'}
                onClose={() => setModalType(null)}
                type="OUT"
                title="Registrar Salida de Inventario"
            />
            <MovementModal
                isOpen={modalType === 'TRANSFER'}
                onClose={() => setModalType(null)}
                type="TRANSFER"
                title="Registrar Transferencia"
            />
        </div>
    );
}
