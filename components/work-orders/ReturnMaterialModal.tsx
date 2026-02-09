'use client';

import { useState, useEffect } from 'react';
import { returnWorkOrderLine } from '@/app/actions/work-order-lines';
import { getInventoryLocations, type InventoryLocation } from '@/app/actions/catalog';

type ReturnMaterialModalProps = {
    workOrderId: string;
    lines: any[];
    onClose: () => void;
    onSuccess: () => void;
};

export default function ReturnMaterialModal({ workOrderId, lines, onClose, onSuccess }: ReturnMaterialModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);

    const materialLines = lines.filter(l => l.kind === 'MATERIAL' && l.item_id);

    const [selectedLineId, setSelectedLineId] = useState(materialLines[0]?.id || '');
    const [qty, setQty] = useState(1);
    const [locationId, setLocationId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        getInventoryLocations().then(locs => {
            setLocations(locs);
            if (locs.length > 0) setLocationId(locs[0].id);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedLineId || !locationId || qty <= 0) {
            setError('Complete todos los campos requeridos');
            setLoading(false);
            return;
        }

        const result = await returnWorkOrderLine(selectedLineId, workOrderId, qty, locationId, notes);

        if (!result.success) {
            setError(result.error || 'Error desconocido');
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    if (materialLines.length === 0) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
            }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', textAlign: 'center' }}>
                    <p>No hay materiales vinculados al inventario en esta orden.</p>
                    <button onClick={onClose} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <style jsx>{`
                .modal-content { background-color: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
            `}</style>

            <div className="modal-content">
                <h2 style={{ marginTop: 0 }}>Devolver Material</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Material a devolver</label>
                        <select value={selectedLineId} onChange={e => setSelectedLineId(e.target.value)} required>
                            {materialLines.map(l => (
                                <option key={l.id} value={l.id}>{l.name} (Cantidad: {l.qty})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Cantidad *</label>
                        <input type="number" step="0.01" value={qty} onChange={e => setQty(parseFloat(e.target.value))} required min="0.01" />
                    </div>

                    <div className="form-group">
                        <label>Almacén de destino *</label>
                        <select value={locationId} onChange={e => setLocationId(e.target.value)} required>
                            <option value="">-- Seleccionar ubicación --</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Motivo / Notas</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Material no utilizado" />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                            {loading ? 'Procesando...' : 'Devolver a Inventario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
