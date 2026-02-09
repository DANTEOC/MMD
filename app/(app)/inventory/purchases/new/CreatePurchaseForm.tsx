'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProviders } from '@/app/actions/providers';
import { getLocations, getItems } from '@/app/actions/inventory';
import { getTenantUsers } from '@/app/actions/users';
import { createPurchase } from '@/app/actions/purchases';
import Link from 'next/link';

export default function CreatePurchaseForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [providers, setProviders] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [tenantUsers, setTenantUsers] = useState<any[]>([]);

    const [items, setItems] = useState<{ id: string, item_id: string, quantity: number, cost: number }[]>([
        { id: '1', item_id: '', quantity: 1, cost: 0 }
    ]);

    useEffect(() => {
        getProviders().then(setProviders);
        getLocations().then(setLocations);
        getItems().then(data => {
            // Filtrar solo productos físicos
            setProducts(data.filter((i: any) => i.kind === 'PRODUCT'));
        });
        getTenantUsers().then(setTenantUsers);
    }, []);

    const handleAddItem = () => {
        setItems([...items, { id: Math.random().toString(), item_id: '', quantity: 1, cost: 0 }]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(i => {
            if (i.id === id) {
                // If Item ID changes, update default cost
                if (field === 'item_id') {
                    const prod = products.find(p => p.id === value);
                    return { ...i, [field]: value, cost: prod?.base_cost || 0 };
                }
                return { ...i, [field]: value };
            }
            return i;
        }));
    };

    const [taxRate, setTaxRate] = useState(0.16);
    const [taxAmount, setTaxAmount] = useState<number | null>(null); // If null, auto calculate
    const [overrideTax, setOverrideTax] = useState(false);

    // Calculations
    const getSubtotal = () => items.reduce((sum, i) => sum + (i.quantity * i.cost), 0);

    // Derived tax: manual override OR calculated default
    const getTax = () => {
        if (overrideTax && taxAmount !== null) return taxAmount;
        return getSubtotal() * taxRate;
    };

    const getTotal = () => getSubtotal() + getTax();

    const handleTaxRateChange = (rate: number) => {
        setTaxRate(rate);
        if (!overrideTax) {
            // Recalculate implicitly
        }
    };

    const handleTotalTaxChange = (amount: number) => {
        setOverrideTax(true);
        setTaxAmount(amount);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const providerId = formData.get('provider_id') as string;
        const locationId = formData.get('location_id') as string;
        const notes = formData.get('notes') as string;

        // Validation
        const validItems = items.filter(i => i.item_id && i.quantity > 0);
        if (validItems.length === 0) {
            setError('Agrega al menos un producto válido');
            setLoading(false);
            return;
        }

        const calculatedSubtotal = getSubtotal();
        const calculatedTax = getTax();

        if (calculatedTax < 0) {
            setError('El impuesto no puede ser negativo');
            setLoading(false);
            return;
        }

        const title = formData.get('title') as string;
        const purchaseDate = formData.get('purchase_date') as string;
        const responsibleUserId = formData.get('responsible_user_id') as string;
        const paymentMethod = formData.get('payment_method') as string;

        const res = await createPurchase({
            title,
            purchase_date: purchaseDate,
            responsible_user_id: responsibleUserId,
            payment_method: paymentMethod,
            provider_id: providerId,
            location_id: locationId,
            notes,
            items: validItems.map(i => ({
                item_id: i.item_id,
                quantity: Number(i.quantity),
                cost_estimated: Number(i.cost)
            })),
            // Tax fields
            subtotal_estimated: calculatedSubtotal,
            tax_rate_estimated: overrideTax ? 0 : taxRate, // If overridden, rate might not match strict %, but sending current helps defaults
            tax_estimated: calculatedTax
        });

        if (!res.success) {
            setError(res.error || 'Error al crear');
            setLoading(false);
        } else {
            router.push('/inventory/purchases');
        }
    };

    // ... (rest of render)

    return (
        <form onSubmit={handleSubmit}>
            {/* ... (error and inputs top) ... */}
            {/* Same Items List code ... */}

            {/* NEW FIELDS: Title, Date, Responsible, Payment */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.9rem' }}>Concepto / Título *</label>
                    <input name="title" required placeholder="Ej. Compra mensual de insumos" style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.9rem' }}>Fecha de Compra *</label>
                    <input type="date" name="purchase_date" required defaultValue={new Date().toISOString().split('T')[0]} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.9rem' }}>Responsable *</label>
                    <select name="responsible_user_id" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="">-- Seleccionar Usuario --</option>
                        {tenantUsers.map((u: any, i: number) => (
                            <option key={`usr-${u.user_id || i}`} value={u.user_id}>
                                {u.profile?.full_name || u.profile?.email} ({u.role_key})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.9rem' }}>Forma de Pago *</label>
                    <select name="payment_method" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="CASH">Efectivo</option>
                        <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                        <option value="DEBIT_CARD">Tarjeta de Débito</option>
                        <option value="TRANSFER">Transferencia</option>
                        <option value="CHECK">Cheque</option>
                        <option value="CREDIT_PROVIDER">Crédito Proveedor (CxP)</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.9rem' }}>Proveedores *</label>
                    <select name="provider_id" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="">-- Seleccionar --</option>
                        {providers.map((p, i) => <option key={`prov-${p.id || i}`} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.9rem' }}>Almacén de Destino *</label>
                    <select name="location_id" required style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="">-- Seleccionar --</option>
                        {locations.map((l, i) => <option key={`loc-${l.id || i}`} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Same Items List code ... */}
            {/* TOTALS SECTION */}
            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '1rem', color: '#555' }}>
                    <span>Subtotal:</span>
                    <strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(getSubtotal())}</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#666' }}>IVA ({(taxRate * 100).toFixed(0)}%)</label>
                        {!overrideTax && (
                            <button
                                type="button"
                                onClick={() => setOverrideTax(true)}
                                style={{ fontSize: '0.75rem', color: '#1976d2', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                Editar Monto Manual
                            </button>
                        )}
                        {overrideTax && (
                            <button
                                type="button"
                                onClick={() => { setOverrideTax(false); setTaxAmount(null); }}
                                style={{ fontSize: '0.75rem', color: '#666', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                            >
                                Revertir a Automático
                            </button>
                        )}
                    </div>

                    {overrideTax ? (
                        <input
                            type="number"
                            min="0" step="0.01"
                            value={taxAmount ?? getSubtotal() * taxRate}
                            onChange={(e) => handleTotalTaxChange(Number(e.target.value))}
                            style={{ width: '120px', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc', textAlign: 'right' }}
                        />
                    ) : (
                        <div style={{ width: '120px', textAlign: 'right', color: '#666' }}>
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(getSubtotal() * taxRate)}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '2rem', fontSize: '1.25rem', borderTop: '2px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span>Total Estimado:</span>
                    <strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(getTotal())}</strong>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Notas (Opcional)</label>
                <textarea name="notes" rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <Link href="/inventory/purchases" style={{ padding: '0.75rem 1.5rem', color: '#666', textDecoration: 'none' }}>
                    Cancelar
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.75rem 2rem',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Guardando...' : 'Guardar Compra'}
                </button>
            </div>
        </form>
    );
}
