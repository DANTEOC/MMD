import { requireAdmin } from '@/lib/auth/guards';
import { getTenantRequests } from '@/app/actions/requests';
import Link from 'next/link';
import RequestItem from './RequestItem';

export default async function AdminRequestsPage() {
    const auth = await requireAdmin();
    const requests = await getTenantRequests(auth.tenantId);

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Solicitudes de Acceso</h1>
                <Link
                    href="/dashboard"
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#666',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                    }}
                >
                    ← Dashboard
                </Link>
            </div>

            <div style={{
                padding: '1rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                marginBottom: '2rem',
                border: '1px solid #2196f3'
            }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1565c0' }}>
                    <strong>Tenant ID:</strong> {auth.tenantId}
                </p>
            </div>

            {requests.length === 0 ? (
                <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>No hay solicitudes pendientes.</p>
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    padding: '1.5rem'
                }}>
                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                        Pendientes ({requests.length})
                    </h2>

                    {requests.map((req: any) => (
                        <RequestItem key={req.id} request={req} />
                    ))}
                </div>
            )}
        </div>
    );
}
