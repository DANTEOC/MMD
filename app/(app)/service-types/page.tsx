import { requireAuth } from '@/lib/auth/guards';
import { getServiceTypes } from '@/app/actions/service-types';
import ServiceTypeList from './ServiceTypeList';
import { redirect } from 'next/navigation';

export default async function ServiceTypesPage() {
    const auth = await requireAuth();

    if (!['Admin', 'Operador'].includes(auth.roleKey)) {
        redirect('/dashboard');
    }

    const serviceTypes = await getServiceTypes(); // Fetch all

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Catálogo de Tipos de Servicio</h1>
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '2rem'
            }}>
                <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                        Define los tipos de servicio disponibles para las órdenes de trabajo.
                    </p>
                </div>

                <ServiceTypeList initialServiceTypes={serviceTypes} />
            </div>
        </div>
    );
}
