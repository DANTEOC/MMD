import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { getWorkOrder } from '@/app/actions/work-orders';
import { getWorkOrderLines } from '@/app/actions/work-order-lines';
import { redirect } from 'next/navigation';
import PrintControl from './PrintControl';

export const metadata = {
    title: 'Imprimir Documento | MMD Maintenance',
};

export const dynamic = 'force-dynamic';

export default async function PrintPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const auth = await requireAuth();
    const supabase = await createClient();

    // Fetch Data
    const workOrder = await getWorkOrder(id);
    if (!workOrder) redirect('/work-orders');

    const lines = await getWorkOrderLines(id);

    // Fetch Tenant Info (Updated with Ticket 12 fields)
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*') // create: logo_url, tax_id, address_*, etc.
        .eq('id', auth.tenantId)
        .single();

    // Defaults
    const tenantName = tenant?.name || 'Taller Mecánico';
    const logoUrl = tenant?.logo_url;
    const items = lines;

    // Format helpers
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
    };
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const isQuote = workOrder.status === 'quote';
    const documentType = isQuote ? 'COTIZACIÓN' : 'ORDEN DE TRABAJO';
    const documentColor = isQuote ? '#f97316' : '#2563eb'; // Orange for Quote, Blue for WO

    // Group lines
    const services = lines.filter(l => l.kind === 'SERVICE');
    const materials = lines.filter(l => l.kind === 'MATERIAL');

    return (
        <div style={{ backgroundColor: '#525252', minHeight: '100vh', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .page-container { 
                        box-shadow: none !important; 
                        margin: 0 !important; 
                        width: 100% !important; 
                        max-width: none !important;
                        border-radius: 0 !important;
                    }
                }
            `}</style>

            <PrintControl />

            <div className="page-container" style={{
                backgroundColor: 'white',
                width: '100%',
                maxWidth: '850px', // A4 aprox
                minHeight: '1100px',
                padding: '0', // Full bleed internal
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                color: '#1f2937',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header Bar */}
                <div style={{
                    backgroundColor: documentColor,
                    height: '12px',
                    width: '100%'
                }} />

                <div style={{ padding: '3rem 3rem 1rem 3rem' }}>
                    {/* Top Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>

                        {/* Left: Company Info */}
                        <div style={{ maxWidth: '50%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                {/* Logo Logic */}
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                                ) : (
                                    <div style={{
                                        width: '50px', height: '50px', backgroundColor: documentColor, borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.5rem'
                                    }}>
                                        {tenantName.substring(0, 1)}
                                    </div>
                                )}
                                <div>
                                    <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111827', lineHeight: 1.2 }}>{tenantName}</h1>
                                    {tenant?.tax_id && <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>RFC: {tenant.tax_id}</p>}
                                </div>
                            </div>

                            <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5 }}>
                                {tenant?.address_street && <div>{tenant.address_street}</div>}
                                {tenant?.address_city && <div>{tenant.address_city}, {tenant.address_state} {tenant.address_zip}</div>}
                                {tenant?.contact_phone && <div style={{ marginTop: '0.25rem' }}>Tel: {tenant.contact_phone}</div>}
                                {tenant?.contact_name && <div>Attn: {tenant.contact_name}</div>}
                            </div>
                        </div>

                        {/* Right: Document Info */}
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: documentColor, margin: 0, letterSpacing: '-0.5px' }}>
                                {documentType}
                            </h2>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', margin: '0.25rem 0' }}>#{workOrder.id.substring(0, 8).toUpperCase()}</p>
                            <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Fecha: {formatDate(workOrder.created_at)}</p>

                            {/* Service Type Section */}
                            {workOrder.service_type && (
                                <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                                        {workOrder.service_type.name}
                                    </div>
                                    {workOrder.service_type.description && (
                                        <div style={{ fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic', maxWidth: '300px', marginLeft: 'auto' }}>
                                            {workOrder.service_type.description}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '4px', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>Total a Pagar</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                                    {formatCurrency(workOrder.total_amount || workOrder.subtotal || 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Asset Box */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '1.5rem 0' }}>
                        <div>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>Facturar A</h3>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{workOrder.client?.name || 'Cliente Mostrador'}</div>
                            {workOrder.client?.email && <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{workOrder.client.email}</div>}
                            {workOrder.client?.phone && <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{workOrder.client.phone}</div>}
                            {workOrder.client?.rfc && <div style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.25rem' }}>RFC: {workOrder.client.rfc}</div>}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>Detalles del Vehículo</h3>
                            {workOrder.asset ? (
                                <>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{workOrder.asset.name}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Modelo: {workOrder.asset.model} ({workOrder.asset.year})</div>
                                    {workOrder.asset.license_plate && <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Placas: {workOrder.asset.license_plate}</div>}
                                    {workOrder.odometer && <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>Kilometraje: {workOrder.odometer} km</div>}
                                </>
                            ) : (
                                <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin vehículo asignado</div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ marginBottom: '2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${documentColor}` }}>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'left', fontWeight: 700, color: '#374151' }}>Descripción / Concepto</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'center', width: '80px', fontWeight: 700, color: '#374151' }}>Cant</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right', width: '120px', fontWeight: 700, color: '#374151' }}>Precio</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right', width: '120px', fontWeight: 700, color: '#374151' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Services */}
                                {services.length > 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ paddingTop: '1rem', paddingBottom: '0.5rem', fontWeight: 800, color: documentColor, fontSize: '0.8rem', letterSpacing: '1px' }}>MANO DE OBRA Y SERVICIOS</td>
                                    </tr>
                                )}
                                {services.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 0', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500, color: '#111827' }}>{item.name}</div>
                                            {/* Optional description here if we had it */}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'center', verticalAlign: 'top', color: '#6b7280' }}>
                                            {item.qty} {item.unit?.toLowerCase()}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', verticalAlign: 'top', color: '#6b7280' }}>
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 600, color: '#111827' }}>
                                            {formatCurrency(item.line_total)}
                                        </td>
                                    </tr>
                                ))}

                                {/* Materials */}
                                {materials.length > 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem', fontWeight: 800, color: documentColor, fontSize: '0.8rem', letterSpacing: '1px' }}>REFACCIONES</td>
                                    </tr>
                                )}
                                {materials.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 0', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500, color: '#111827' }}>{item.name}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'center', verticalAlign: 'top', color: '#6b7280' }}>
                                            {item.qty} {item.unit?.toLowerCase()}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', verticalAlign: 'top', color: '#6b7280' }}>
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 600, color: '#111827' }}>
                                            {formatCurrency(item.line_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                        <div style={{ width: '50%', paddingRight: '2rem' }}>
                            {/* Terms */}
                            {tenant?.terms_conditions && (
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.5rem' }}>Términos y Condiciones</h4>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                                        {tenant.terms_conditions}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ width: '40%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee', color: '#4b5563' }}>
                                <span>Subtotal</span>
                                <span>{formatCurrency(workOrder.subtotal || 0)}</span>
                            </div>
                            {/* Only show Tax if > 0 */}
                            {(workOrder.tax_amount || 0) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee', color: '#4b5563' }}>
                                    <span>IVA</span>
                                    <span>{formatCurrency(workOrder.tax_amount)}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: `2px solid ${documentColor}`, marginTop: '0.5rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Total</span>
                                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: documentColor }}>{formatCurrency(workOrder.total_amount || workOrder.subtotal || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Signatures - Sticky at bottom of 'page-container' */}
                <div style={{ marginTop: 'auto', padding: '3rem', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4rem' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.75rem', marginTop: '3rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Autorizado Por</div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{tenantName}</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.75rem', marginTop: '3rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Acepto y Recibo</div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Firma del Cliente</div>
                            </div>
                        </div>
                    </div>
                    {tenant?.footer_text && (
                        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                            {tenant.footer_text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
