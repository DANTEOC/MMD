import { getSuppliers } from '@/app/actions/suppliers';
import CreateSupplierButton from './CreateSupplierButton';
import SupplierActions from './SupplierActions';
import { requireAuth } from '@/lib/auth/guards';
import { Building2, Phone, FileText } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SuppliersPage() {
    const { roleKey } = await requireAuth();

    // Gating explícito
    if (['Tecnico', 'Visitante'].includes(roleKey)) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                <h2>⛔ Acceso Restringido</h2>
                <p>No tienes permisos para ver este módulo.</p>
            </div>
        );
    }

    const suppliers = await getSuppliers();
    const canEdit = ['Admin', 'Supervisor'].includes(roleKey);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 size={32} color="#1976d2" />
                    Proveedores
                </h1>
                {canEdit && <CreateSupplierButton />}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {suppliers.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '8px', color: '#666' }}>
                        No hay proveedores registrados.
                    </div>
                ) : (
                    suppliers.map(provider => (
                        <div key={provider.id} style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            border: '1px solid #eaeaea',
                            padding: '1.5rem',
                            position: 'relative',
                            opacity: provider.is_active ? 1 : 0.7,
                            borderLeft: provider.is_active ? '4px solid #4caf50' : '4px solid #9e9e9e'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{provider.name}</h3>
                                {canEdit && <SupplierActions supplier={provider} />}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.95rem' }}>
                                {provider.tax_id && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555' }}>
                                        <FileText size={16} color="#757575" />
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{provider.tax_id}</span>
                                    </div>
                                )}

                                {provider.contact_info && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#555' }}>
                                        <Phone size={16} color="#757575" style={{ marginTop: '3px' }} />
                                        <span style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{provider.contact_info}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '12px',
                                    backgroundColor: provider.is_active ? '#e8f5e9' : '#f5f5f5',
                                    color: provider.is_active ? '#2e7d32' : '#757575',
                                    fontWeight: 600
                                }}>
                                    {provider.is_active ? 'ACTIVO' : 'SUSPENDIDO'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#999' }}>
                                    Reg: {new Date(provider.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
