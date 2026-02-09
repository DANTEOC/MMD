'use client';

import { useState, useEffect } from 'react';
import { getItems, getLocations, getStock, adjustStockTarget } from '@/app/actions/inventory';
import { useRouter } from 'next/navigation';
import { Sliders, RefreshCw } from 'lucide-react';

export default function AdjustmentsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [stock, setStock] = useState<any[]>([]);

    // Form
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [targetQty, setTargetQty] = useState('');
    const [reason, setReason] = useState('PHYSICAL_COUNT');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Only load if authorized strictly? Page is gated by role in next step or layout.
        // Assuming this component is used in a protected page.
        Promise.all([getItems(), getLocations(), getStock()])
            .then(([i, l, s]) => {
                setItems(i.filter((x: any) => x.is_active && x.kind === 'PRODUCT'));
                setLocations(l.filter((x: any) => x.is_active));
                setStock(s);
            });
    }, []);

    const currentStock = stock.find(
        (s: any) => s.item?.id === selectedItemId && s.location?.id === selectedLocationId
    )?.quantity || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirm('¿Confirmar ajuste de inventario? Esto generará un movimiento automático.')) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('item_id', selectedItemId);
        formData.append('location_id', selectedLocationId);
        formData.append('target_qty', targetQty);
        formData.append('reason_code', reason);
        formData.append('notes', notes);

        const res = await adjustStockTarget(formData);

        if (!res.success) {
            alert(res.error);
        } else {
            alert('Ajuste realizado correctamente.');
            // Refresh data
            const newStock = await getStock();
            setStock(newStock);
            // Reset crucial fields
            setTargetQty(''); setNotes('');
            router.refresh();
        }
        setLoading(false);
    };

    const delta = (Number(targetQty) || 0) - currentStock;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#333' }}>
                <Sliders size={32} color="#455a64" /> Ajustes de Inventario
            </h1>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#555' }}>Ítem</label>
                            <select
                                value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="">Seleccionar...</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#555' }}>Almacén</label>
                            <select
                                value={selectedLocationId} onChange={e => setSelectedLocationId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                                <option value="">Seleccionar...</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedItemId && selectedLocationId && (
                        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '6px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Stock Actual</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                                {currentStock}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#555' }}>Nueva Cantidad (Objetivo)</label>
                            <input
                                type="number" step="0.01" min="0" required
                                value={targetQty} onChange={e => setTargetQty(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1.1rem' }}
                            />
                        </div>

                        <div style={{ paddingTop: '2rem' }}>
                            {targetQty !== '' && (
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    backgroundColor: delta === 0 ? '#eee' : delta > 0 ? '#e8f5e9' : '#ffebee',
                                    color: delta === 0 ? '#666' : delta > 0 ? '#2e7d32' : '#c62828',
                                    fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    <RefreshCw size={18} />
                                    {delta > 0 ? `Entrada (+${delta})` : delta < 0 ? `Salida (${delta})` : 'Sin cambios'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#555' }}>Motivo</label>
                        <select
                            value={reason} onChange={e => setReason(e.target.value)}
                            required
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="PHYSICAL_COUNT">Conteo Físico</option>
                            <option value="DAMAGE">Daño / Merma</option>
                            <option value="ERROR_CORRECTION">Corrección de Error</option>
                            <option value="THEFT">Robo / Pérdida</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#555' }}>Notas</label>
                        <textarea
                            value={notes} onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Detalles adicionales..."
                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button
                            type="submit"
                            disabled={loading || !selectedItemId || !selectedLocationId}
                            style={{
                                padding: '0.75rem 2rem',
                                backgroundColor: '#455a64', color: 'white',
                                border: 'none', borderRadius: '4px',
                                fontSize: '1rem', cursor: 'pointer',
                                opacity: (loading || !selectedItemId) ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Procesando...' : 'Aplicar Ajuste'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
