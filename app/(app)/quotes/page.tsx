export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/auth/guards';
import { getWorkOrders } from '@/app/actions/work-orders';
import Link from 'next/link';
import { FileText, Printer, ArrowRight, User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export const metadata = {
    title: 'Cotizaciones | MMD Maintenance',
    description: 'Gestión de cotizaciones',
};

export default async function QuotesPage() {
    const auth = await requireAuth();
    // Fetch only quotes
    const quotes = await getWorkOrders({ status: 'quote' });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Cotizaciones
                    </h1>
                    <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                        Cotizaciones pendientes de aprobación.
                    </p>
                </div>
                <Link
                    href="/work-orders/new?mode=quote"
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    + Nueva Cotización
                </Link>
            </div>

            {quotes.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px dashed #e5e7eb',
                    color: '#6b7280'
                }}>
                    <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        No hay cotizaciones pendientes
                    </h3>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {quotes.map((quote) => (
                        <div key={quote.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #f3f4f6',
                            padding: '1.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                                        {quote.document_number || `#${quote.id.substring(0, 8)}`}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {formatDate(quote.created_at)}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                                    {quote.title}
                                </h3>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                    <User size={16} className="text-gray-400" />
                                    {quote.client?.name || 'Cliente sin asignar'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                                    <DollarSign size={16} className="text-gray-400" />
                                    <span style={{ fontWeight: 600, color: '#059669' }}>
                                        {formatCurrency(quote.total || 0)}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <Link
                                    href={`/work-orders/${quote.id}`}
                                    style={{
                                        flex: 1,
                                        padding: '0.6rem',
                                        textAlign: 'center',
                                        backgroundColor: '#f9fafb',
                                        color: '#374151',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.9rem',
                                        fontWeight: 600
                                    }}
                                >
                                    Abrir
                                </Link>
                                <Link
                                    href={`/work-orders/${quote.id}/print`}
                                    target="_blank"
                                    style={{
                                        flex: 1,
                                        padding: '0.6rem',
                                        textAlign: 'center',
                                        backgroundColor: '#fff',
                                        color: '#4b5563',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Printer size={16} /> Imprimir
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
