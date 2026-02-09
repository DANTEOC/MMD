import { requireAuth } from '@/lib/auth/guards';
import { unstable_noStore as noStore } from 'next/cache';
import { getWorkOrder } from '@/app/actions/work-orders';
import { getWorkOrderLines } from '@/app/actions/work-order-lines';
import { getClients } from '@/app/actions/clients';
import { getAssets } from '@/app/actions/assets';
import { getServiceTypes } from '@/app/actions/service-types';
import { getTenantUsers } from '@/app/actions/users';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WorkOrderDetailContent from '@/app/(app)/work-orders/[id]/WorkOrderDetailContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth();
    const { id } = await params;

    // Fetch work order first
    const workOrder = await getWorkOrder(id);

    if (!workOrder) {
        notFound();
    }

    // Fetch related data in parallel
    const [lines, clients, assets, serviceTypes, users] = await Promise.all([
        getWorkOrderLines(id),
        getClients(),
        workOrder.client_id ? getAssets(workOrder.client_id) : Promise.resolve([]),
        getServiceTypes(),
        getTenantUsers()
    ]);

    const { roleKey } = auth;
    const isTechnician = roleKey === 'Tecnico';
    const isQuote = workOrder.status === 'quote';

    // 🖥️ New Redesigned Layout for ALL users (Admin, Supervisor, Técnico)
    return (
        <div style={{
            padding: '2rem',
            fontFamily: 'system-ui',
            maxWidth: '1200px',
            margin: '0 auto',
            backgroundColor: '#fafafa',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <Link
                    href={isQuote ? '/quotes' : '/work-orders'}
                    style={{
                        color: '#666',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        display: 'inline-block',
                        marginBottom: '1rem'
                    }}
                >
                    ← Volver a la lista
                </Link>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>
                            {isQuote ? 'Cotización: ' : 'Orden de Servicio: '}
                            {workOrder.document_number || workOrder.id.substring(0, 8)}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                        <div>
                            <strong>Creada por:</strong> {workOrder.creator?.full_name || workOrder.creator?.email || 'N/A'}
                        </div>
                        <div>
                            <strong>Fecha:</strong> {new Date(workOrder.created_at).toLocaleDateString('es-MX')} {new Date(workOrder.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <WorkOrderDetailContent
                workOrder={workOrder}
                lines={lines}
                clients={clients}
                assets={assets}
                serviceTypes={serviceTypes}
                users={users}
                roleKey={roleKey}
                isQuote={isQuote}
            />
        </div>
    );
}
