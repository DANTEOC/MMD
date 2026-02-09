import { requireAuth } from '@/lib/auth/guards';
import { getPurchases } from '@/app/actions/purchases';
import { getProviders } from '@/app/actions/providers';
import { getLocations } from '@/app/actions/inventory';
import Link from 'next/link';

export default async function PurchasesPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string, location?: string, provider?: string }>
}) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') {
        return <div style={{ padding: '2rem' }}>Acceso Denegado</div>;
    }

    const params = await searchParams;
    const filters = {
        status: params?.status || 'all',
        location_id: params?.location || 'all',
        provider_id: params?.provider || 'all'
    };

    const purchases = await getPurchases(filters);
    const providers = await getProviders();
    const locations = await getLocations(); // Usar getLocations correctamente

    const canCreate = ['Admin', 'Supervisor'].includes(auth.roleKey);

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Compras e Ingresos</h1>
                {canCreate && (
                    <Link
                        href="/inventory/purchases/new"
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontWeight: 500
                        }}
                    >
                        + Nueva Compra
                    </Link>
                )}
            </div>

            {/* Filters */}
            <form style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <select
                    name="status"
                    defaultValue={filters.status}
                    key={filters.status} // Force re-render on change if needed, but standard form submit works
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="all">Todos los Estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="received">Recibida</option>
                    <option value="cancelled">Cancelada</option>
                </select>

                <select
                    name="location"
                    defaultValue={filters.location_id}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="all">Todos los Almacenes</option>
                    {locations.map((loc: any) => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>

                <select
                    name="provider"
                    defaultValue={filters.provider_id}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                    <option value="all">Todos los Proveedores</option>
                    {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Filtrar
                </button>
            </form>

            {/* List */}
            {purchases.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1rem' }}>Aún no hay compras registradas.</p>
                    {canCreate && (
                        <Link href="/inventory/purchases/new" style={{ color: '#2196f3', fontWeight: 500 }}>
                            Crear la primera compra
                        </Link>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {purchases.map(p => {
                        const isReceived = p.status === 'received';
                        return (
                            <Link
                                key={p.id}
                                href={`/inventory/purchases/${p.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{
                                    backgroundColor: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    border: '1px solid #eee',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                            {(p.provider as any)?.name} • {(p.location as any)?.name}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            {new Date(p.created_at).toLocaleDateString()} — {p.id.split('-')[0].toUpperCase()}
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            marginBottom: '0.5rem',
                                            fontWeight: 600,
                                            fontSize: '1.1rem',
                                            color: isReceived ? '#4caf50' : '#666'
                                        }}>
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(isReceived ? p.total_real : p.total_estimated)}
                                        </div>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            backgroundColor: isReceived ? '#e8f5e9' : (p.status === 'cancelled' ? '#ffebee' : '#fff3e0'),
                                            color: isReceived ? '#2e7d32' : (p.status === 'cancelled' ? '#c62828' : '#ef6c00')
                                        }}>
                                            {p.status === 'pending' ? 'PENDIENTE' : (p.status === 'received' ? 'RECIBIDA' : 'CANCELADA')}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
