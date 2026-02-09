'use client';

import { useState, useEffect } from 'react';
import { getItems, getLocations, returnStock } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';
import { PackageX, AlertTriangle } from 'lucide-react';

interface Props {
    workOrderId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ReturnMaterialModal({ workOrderId, isOpen, onClose }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);

    // Form
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            Promise.all([getItems(), getLocations()])
                .then(([i, l]) => {
                    setItems(i.filter((x: any) => x.is_active && x.kind === 'PRODUCT'));
                    setLocations(l.filter((x: any) => x.is_active));
                });

            // Reset
            setSelectedItemId(''); setSelectedLocationId(''); setQuantity(''); setNotes('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('item_id', selectedItemId);
        formData.append('location_id', selectedLocationId);
        formData.append('quantity', quantity);
        formData.append('notes', notes);
        formData.append('reference_type', 'OS');
        formData.append('reference_id', workOrderId);
        formData.append('reason_code', 'OS_RETURN');

        const res = await returnStock(formData);

        if (!res.success) {
            alert(res.error);
        } else {
            alert('Devolución registrada correctamente.');
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#e65100' }}>
                    <PackageX size={24} />
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#333' }}>Devolver Material</h2>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#fff3e0', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#e65100', display: 'flex', gap: '0.5rem' }}>
                    <AlertTriangle size={20} style={{ minWidth: '20px' }} />
                    <p style={{ margin: 0 }}>
                        Esta acción generará una <strong>ENTRADA</strong> de inventario ligada a esta Orden de Servicio. Úsalo para materiales sobrantes o dañados.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Producto a Devolver</label>
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
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Almacén Destino</label>
                        <select
                            value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        >
                            <option value="">Seleccionar...</option>
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Cantidad</label>
                        <input
                            type="number" step="0.01" min="0.001" required
                            value={quantity} onChange={e => setQuantity(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#555' }}>Motivo / Notas</label>
                        <textarea
                            value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Sobrante, Dañado, Error de captura..."
                            rows={2}
                            required
                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '0.6rem 1rem', background: 'none', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" disabled={loading} style={{ padding: '0.6rem 1rem', backgroundColor: '#e65100', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'Procesando...' : 'Confirmar Devolución'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
