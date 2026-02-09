'use client';

import { useState, useEffect } from 'react';
import { getItems, getLocations, inventoryIn, inventoryOut, inventoryTransfer } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';

type MovementType = 'IN' | 'OUT' | 'TRANSFER';

interface Props {
    type: MovementType;
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export default function MovementModal({ type, isOpen, onClose, title }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Form states
    const [itemId, setItemId] = useState('');
    const [locationFrom, setLocationFrom] = useState('');
    const [locationTo, setLocationTo] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reference, setReference] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDataLoading(true);
            Promise.all([getItems(), getLocations()])
                .then(([i, l]) => {
                    setItems(i.filter((x: any) => x.is_active && x.is_stockable)); // Only stockable active items
                    setLocations(l.filter((x: any) => x.is_active));
                })
                .finally(() => setDataLoading(false));

            // Reset form
            setItemId(''); setLocationFrom(''); setLocationTo(''); setQuantity(''); setReference('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('item_id', itemId);
        formData.append('quantity', quantity);
        formData.append('reference', reference);

        if (type === 'IN') {
            formData.append('location_to_id', locationTo);
            const res = await inventoryIn(formData);
            handleResult(res);
        } else if (type === 'OUT') {
            formData.append('location_from_id', locationFrom);
            const res = await inventoryOut(formData);
            handleResult(res);
        } else if (type === 'TRANSFER') {
            formData.append('location_from_id', locationFrom);
            formData.append('location_to_id', locationTo);
            if (locationFrom === locationTo) {
                alert('Origen y destino deben ser diferentes');
                setLoading(false);
                return;
            }
            const res = await inventoryTransfer(formData);
            handleResult(res);
        }
    };

    const handleResult = (res: any) => {
        if (!res.success) {
            alert(res.error);
            setLoading(false);
        } else {
            alert('Movimiento registrado exitosamente');
            setLoading(false);
            onClose();
            router.refresh();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '450px', maxWidth: '95%'
            }}>
                <h2 style={{ marginTop: 0 }}>{title}</h2>

                {dataLoading ? <p>Cargando datos...</p> : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Item</label>
                            <select
                                value={itemId} onChange={e => setItemId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <option value="">Seleccionar Item...</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                            </select>
                        </div>

                        {(type === 'OUT' || type === 'TRANSFER') && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Origen</label>
                                <select
                                    value={locationFrom} onChange={e => setLocationFrom(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="">Seleccionar Origen...</option>
                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>)}
                                </select>
                            </div>
                        )}

                        {(type === 'IN' || type === 'TRANSFER') && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Destino</label>
                                <select
                                    value={locationTo} onChange={e => setLocationTo(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="">Seleccionar Destino...</option>
                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Cantidad</label>
                                <input
                                    type="number" step="0.01" min="0.001" required
                                    value={quantity} onChange={e => setQuantity(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Referencia (WO, PO, Nota)</label>
                                <input
                                    type="text" required
                                    value={reference} onChange={e => setReference(e.target.value)}
                                    placeholder="Ej. Ajuste inicial, OT-123"
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {loading ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
