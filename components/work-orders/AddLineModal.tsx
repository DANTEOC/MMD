'use client';

import { useState, useEffect } from 'react';
import { addWorkOrderLine, updateWorkOrderLine, type AddLineData } from '@/app/actions/work-order-lines';
import { getCatalogItems, getInventoryLocations, type CatalogItem, type InventoryLocation } from '@/app/actions/catalog';

type AddLineModalProps = {
    workOrderId: string;
    line?: any; // To support editing
    defaultKind?: 'SERVICE' | 'MATERIAL';
    onClose: () => void;
    onSuccess: () => void;
};

export default function AddLineModal({ workOrderId, line, defaultKind, onClose, onSuccess }: AddLineModalProps) {
    const isEdit = !!line;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data Loading
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

    const [formData, setFormData] = useState<AddLineData>({
        kind: line?.kind || defaultKind || 'SERVICE',
        name: line?.name || '',
        qty: line?.qty || 1,
        unit: line?.unit || 'unit',
        unit_price: line?.unit_price || 0,
        cost_unit: line?.cost_unit || 0,
        catalog_item_id: line?.catalog_item_id || undefined,
        location_id: line?.location_id || undefined
    });

    useEffect(() => {
        // Load Catalog and Locations
        Promise.all([
            getCatalogItems(), // Load all or filter by kind dynamically? Let's load all and filter in UI
            getInventoryLocations()
        ]).then(([items, locs]) => {
            setCatalogItems(items);
            setLocations(locs);
        });
    }, []);

    // Filter items based on selected kind (SERVICE/MATERIAL)
    // Map 'MATERIAL' (Work Order term) to 'PRODUCT' (Catalog term)
    const filterKind = formData.kind === 'MATERIAL' ? 'PRODUCT' : 'SERVICE';
    const filteredItems = catalogItems.filter(i => i.kind === filterKind);

    const handleKindChange = (kind: 'SERVICE' | 'MATERIAL') => {
        setFormData(prev => ({
            ...prev,
            kind,
            name: '',
            unit: 'unit',
            unit_price: 0,
            cost_unit: 0,
            catalog_item_id: undefined,
            location_id: undefined
        }));
        setSelectedItem(null);
    };

    const handleItemChange = (itemId: string) => {
        const item = catalogItems.find(i => i.id === itemId);
        if (item) {
            setSelectedItem(item);
            setFormData(prev => ({
                ...prev,
                name: item.name,
                unit: item.unit,
                unit_price: item.sale_price,
                cost_unit: item.base_cost,
                catalog_item_id: item.id,
                // If switching items, reset location unless needed
                location_id: item.is_stockable ? prev.location_id : undefined
            }));
        } else {
            // "Custom" item? Or just reset
            setSelectedItem(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation for stockable
        if (selectedItem?.is_stockable && !formData.location_id) {
            setError('Debe seleccionar una ubicación de origen para este material');
            setLoading(false);
            return;
        }

        let result;
        if (isEdit) {
            result = await updateWorkOrderLine(line.id, workOrderId, formData);
        } else {
            result = await addWorkOrderLine(workOrderId, formData);
        }

        if (!result.success) {
            setError(result.error || 'Error desconocido');
            setLoading(false);
        } else {
            onSuccess();
        }
    };

    const handleChange = (field: keyof AddLineData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <style jsx>{`
                .modal-content {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    position: relative;
                }
                .form-control {
                    margin-bottom: 1rem;
                }
                .form-control label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                .form-control input, .form-control select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem; /* Larger font for mobile inputs */
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                @media (max-width: 768px) {
                    .modal-content {
                        width: 100%;
                        height: 100%;
                        max-width: none;
                        max-height: none;
                        border-radius: 0;
                        padding: 1.5rem;
                        display: flex;
                        flex-direction: column;
                    }
                    .modal-title {
                        margin-bottom: 1.5rem;
                    }
                    .modal-actions {
                        margin-top: auto; /* Push to bottom */
                        flex-direction: column-reverse; /* Cancel at bottom */
                    }
                    .modal-actions button {
                        width: 100%;
                        padding: 1rem; /* Larger touch target */
                    }
                }
            `}</style>
            <div className="modal-content">
                <h2 className="modal-title" style={{ marginTop: 0 }}>
                    {isEdit ? 'Editar Línea' : 'Agregar Línea'}
                </h2>

                {error && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Tipo */}
                    <div className="form-control">
                        <label>Tipo</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="radio"
                                    name="kind"
                                    value="SERVICE"
                                    checked={formData.kind === 'SERVICE'}
                                    onChange={() => handleKindChange('SERVICE')}
                                />
                                Servicio
                            </label>
                            <label style={{ fontWeight: 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="radio"
                                    name="kind"
                                    value="MATERIAL"
                                    checked={formData.kind === 'MATERIAL'}
                                    onChange={() => handleKindChange('MATERIAL')}
                                />
                                Material
                            </label>
                        </div>
                    </div>

                    {/* Catálogo */}
                    <div className="form-control">
                        <label>Buscar Item (opcional)</label>
                        <select
                            value={formData.catalog_item_id || ''}
                            onChange={(e) => handleItemChange(e.target.value)}
                            style={{ backgroundColor: '#f9f9f9' }}
                        >
                            <option value="">-- Seleccionar del catálogo --</option>
                            {filteredItems.map((item, i) => (
                                <option key={item.id || i} value={item.id}>
                                    {item.name} ({item.unit})
                                </option>
                            ))}
                        </select>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#999' }}>
                            * O escriba manualmente abajo si no está en catálogo
                        </div>
                    </div>

                    {/* Nombre (Editable even if selected from catalog) */}
                    <div className="form-control">
                        <label>Descripción / Nombre *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            placeholder="Ej: Mantenimiento Preventivo"
                        />
                    </div>

                    {/* Ubicación (Only if stockable) */}
                    {selectedItem?.is_stockable && (
                        <div className="form-control" style={{ backgroundColor: '#e3f2fd', padding: '1rem', borderRadius: '4px' }}>
                            <label style={{ fontWeight: 600, color: '#1565c0' }}>
                                📦 Origen de Inventario (Requerido)
                            </label>
                            <select
                                value={formData.location_id || ''}
                                onChange={(e) => handleChange('location_id', e.target.value)}
                                required
                                style={{ border: '1px solid #1976d2' }}
                            >
                                <option value="">-- Seleccionar Ubicación --</option>
                                {locations.map((loc, i) => (
                                    <option key={loc.id || i} value={loc.id}>
                                        {loc.name} ({loc.type})
                                    </option>
                                ))}
                            </select>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                                Se descontará del stock inmediatamente.
                            </div>
                        </div>
                    )}

                    {/* Cantidad y Unidad */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-control">
                            <label>Cantidad *</label>
                            <input
                                type="number"
                                value={formData.qty}
                                onChange={(e) => handleChange('qty', parseFloat(e.target.value))}
                                required
                                min="0.01"
                                step="0.01"
                            />
                        </div>
                        <div className="form-control">
                            <label>Unidad</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => handleChange('unit', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                <option value="unit">Pieza / Unidad</option>
                                <option value="hr">Hora</option>
                                <option value="day">Día</option>
                                <option value="service">Servicio</option>
                                <option value="lt">Litro</option>
                                <option value="kg">Kilogramo</option>
                                <option value="gr">Gramo</option>
                                <option value="gal">Galón</option>
                                <option value="mt">Metro</option>
                                <option value="cm">Centímetro</option>
                                <option value="kit">Kit / Juego</option>
                            </select>
                        </div>
                    </div>

                    {/* Precio Unitario y Costo Unitario */}
                    {/* Solo mostrar si NO es stockable o si se desea override? 
                        Costo debería estar oculto o readonly si viene de inventario?
                        Ticket dice: "El costo unitario aplicado ... No se recalcula"
                        Vamos a permitir verlo pero sugerir no editarlo si es stockable.
                    */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                                Precio Venta Unitario
                            </label>
                            <input
                                type="number"
                                value={formData.unit_price}
                                onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#666' }}>
                                Costo Unitario
                            </label>
                            <input
                                type="number"
                                value={formData.cost_unit}
                                onChange={(e) => handleChange('cost_unit', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    backgroundColor: 'white',
                                    color: 'black'
                                }}
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
