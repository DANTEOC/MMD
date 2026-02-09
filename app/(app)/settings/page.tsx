import { requireAuth } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
    const auth = await requireAuth();
    if (auth.roleKey !== 'Admin') {
        return <div style={{ padding: '2rem' }}>Acceso restringido a Administradores.</div>;
    }

    const supabase = await createClient();
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', auth.tenantId)
        .single();

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px' }}>
            <h1 style={{ marginBottom: '2rem' }}>Configuración</h1>

            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    Información de la Organización
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: '#666' }}>Nombre</div>
                    <div style={{ fontWeight: 500 }}>{tenant?.name}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: '#666' }}>ID del Tenant</div>
                    <div style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {tenant?.id}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ color: '#666' }}>Plan</div>
                    <div>
                        <span style={{ padding: '0.25rem 0.75rem', background: '#e3f2fd', color: '#1565c0', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {tenant?.subscription_plan || 'Free'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    Usuarios
                </h2>
                <div style={{ color: '#666' }}>
                    Gestión de usuarios disponible en módulo Admin (Próximamente).
                </div>
            </div>
        </div>
    );
}
