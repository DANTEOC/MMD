import { requireAuth } from '@/lib/auth/guards';
import { getProviders } from '@/app/actions/providers';
import ProvidersList from '@/components/finance/providers-list';

export const metadata = {
    title: 'Proveedores | MMD Maintenance',
    description: 'Gestión de proveedores y acreedores',
};

export default async function ProvidersPage() {
    const auth = await requireAuth();
    const providers = await getProviders();

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'system-ui' }}>
                    Proveedores
                </h1>
                <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                    Administra tu catálogo de proveedores para compras y servicios.
                </p>
            </div>

            <ProvidersList providers={providers} role={auth.roleKey} />
        </div>
    );
}
