import { requireAuth } from '@/lib/auth/guards';
import { getTenantSettings } from '@/app/actions/tenants';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
    const auth = await requireAuth();

    if (auth.roleKey !== 'Admin') {
        return <div style={{ padding: '2rem' }}>Acceso Restringido</div>;
    }

    const settings = await getTenantSettings();

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '2rem' }}>Configuración de Empresa</h1>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <SettingsForm settings={settings} />
            </div>
        </div>
    );
}
