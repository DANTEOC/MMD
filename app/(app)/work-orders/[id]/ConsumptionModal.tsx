'use client';

import { useState, useEffect } from 'react';
import { getItems, getLocations, getStock } from '@/app/actions/inventory';
import { consumeInventoryItem } from '@/app/actions/work-orders';
import { useRouter } from 'next/navigation';
import { PackageMinus, AlertCircle } from 'lucide-react';

interface Props {
    workOrderId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ConsumptionModal({ workOrderId, isOpen, onClose }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    // Data
    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [stock, setStock] = useState<any[]>([]);

    // Form
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDataLoading(true);
            Promise.all([getItems(), getLocations(), getStock()])
                .then(([i, l, s]) => {
                    setItems(i.filter((x: any) => x.is_active && x.kind === 'PRODUCT'));
                    setLocations(l.filter((x: any) => x.is_active));
                    setStock(s);
                })
                .finally(() => setDataLoading(false));

            // Reset
            setSelectedItemId(''); setSelectedLocationId(''); setQuantity(''); setNotes('');
        }
    }, [isOpen]);

    // Available Stock Logic
    const availableStock = stock.find(
        (s: any) => s.item?.id === selectedItemId && s.location?.id === selectedLocationId
    )?.quantity || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (Number(quantity) > availableStock) {
            alert('Stock insuficiente en la ubicación seleccionada.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('item_id', selectedItemId);
        formData.append('location_id', selectedLocationId);
        formData.append('quantity', quantity);
        formData.append('notes', notes);

        const res = await consumeInventoryItem(workOrderId, formData);

        if (!res.success) {
            alert(res.error);
        } else {
            alert('Consumo registrado correctamente.');
            onClose();
            router.refresh();
        }
        setLoading(false);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <PackageMinus size={24} color="#e65100" />
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Registrar Consumo</h2>
                </div>

                {dataLoading ? <p>Cargando inventario...</p> : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Producto / Refacción</label>
                            <select
                                value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <option value="">Seleccionar...</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Almacén de Origen</label>
                            <select
                                value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)}
                                required
                                disabled={!selectedItemId}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            >
                                <option value="">Seleccionar...</option>
                                {locations.map(loc => {
                                    // Show stock in label if item selected
                                    const qty = stock.find((s: any) => s.item.id === selectedItemId && s.location.id === loc.id)?.quantity || 0;
                                    return <option key={loc.id} value={loc.id}>{loc.name} (Disp: {qty})</option>;
                                })}
                            </select>
                        </div>

                        {selectedItemId && selectedLocationId && (
                            <div style={{ padding: '0.5rem', backgroundColor: availableStock > 0 ? '#e8f5e9' : '#ffebee', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={16} color={availableStock > 0 ? '#2e7d32' : '#c62828'} />
                                <span style={{ color: availableStock > 0 ? '#2e7d32' : '#c62828', fontWeight: 600 }}>
                                    Stock disponible: {availableStock}
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Cantidad a Consumir</label>
                                <input
                                    type="number" step="0.01" min="0.001" required
                                    max={availableStock}
                                    value={quantity} onChange={e => setQuantity(e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Notas (Opcional)</label>
                            <textarea
                                value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Detalles del uso..."
                                rows={2}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                            <button type="button" onClick={onClose} style={{ padding: '0.6rem 1rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" disabled={loading || availableStock <= 0} style={{ padding: '0.6rem 1rem', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (loading || availableStock <= 0) ? 0.6 : 1 }}>
                                {loading ? 'Procesando...' : 'Confirmar Consumo'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
