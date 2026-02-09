import { requireAuth } from '@/lib/auth/guards';
import { getCollectionList } from '@/app/actions/treasury';
import Link from 'next/link';
import CollectionList from './CollectionList';

export default async function CollectionPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return <div>Acceso Denegado</div>;

    const params = await searchParams;
    const status = params?.status || 'unpaid'; // Default to unpaid/partial usually, strictly 'unpaid' means unpaid+partial usually in UI logic or separate filter

    // We can map 'unpaid' filter to fetch both unpaid and partial if we want "Pendientes"
    // Or let user select exact status.
    // For "Cobranza", default seeing everything EXCEPT paid is useful.

    const list = await getCollectionList({ status: status === 'all' ? undefined : status });

    // Calculate Stats
    const totalReceivable = list
        .filter(i => i.payment_status !== 'paid')
        .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid || 0)), 0);

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem' }}>Cobranza</h1>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>Total por Cobrar</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: '#d32f2f' }}>
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalReceivable)}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
                <Link
                    href="/reports/collection?status=unpaid"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '16px',
                        background: status === 'unpaid' ? '#2196f3' : '#e0e0e0',
                        color: status === 'unpaid' ? 'white' : '#333',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    Pendientes
                </Link>
                <Link
                    href="/reports/collection?status=partial"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '16px',
                        background: status === 'partial' ? '#2196f3' : '#e0e0e0',
                        color: status === 'partial' ? 'white' : '#333',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    Parciales
                </Link>
                <Link
                    href="/reports/collection?status=paid"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '16px',
                        background: status === 'paid' ? '#2196f3' : '#e0e0e0',
                        color: status === 'paid' ? 'white' : '#333',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    Pagadas
                </Link>
                <Link
                    href="/reports/collection?status=all"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '16px',
                        background: status === 'all' ? '#2196f3' : '#e0e0e0',
                        color: status === 'all' ? 'white' : '#333',
                        textDecoration: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    Todas
                </Link>
            </div>

            <CollectionList items={list} />
        </div>
    );
}
