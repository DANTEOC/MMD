'use client';

import { useState } from 'react';
import { updateTenantSettings } from '@/app/actions/tenants';
import { useRouter } from 'next/navigation';

export default function SettingsForm({ settings }: { settings: any }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await updateTenantSettings(formData);
            if (res.success) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
                router.refresh();
            } else {
                setMessage({ type: 'error', text: res.error || 'Error al guardar.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '4px',
                    backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
                    color: message.type === 'success' ? '#2e7d32' : '#c62828',
                    border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                }}>
                    {message.text}
                </div>
            )}

            <section>
                <h3 style={{ margin: '0 0 1rem 0', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Identidad</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Logo URL</label>
                        <input
                            name="logo_url"
                            defaultValue={settings?.logo_url || ''}
                            placeholder="https://..."
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            onChange={(e) => {
                                const img = document.getElementById('logo-preview') as HTMLImageElement;
                                if (img) img.src = e.target.value;
                            }}
                        />
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Vista Previa:</p>
                            <img
                                id="logo-preview"
                                src={settings?.logo_url || 'https://via.placeholder.com/150?text=Sin+Logo'}
                                alt="Vista Previa"
                                style={{ height: '80px', objectFit: 'contain', maxWidth: '100%' }}
                                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Error+URL')}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>RFC / Tax ID</label>
                        <input name="tax_id" defaultValue={settings?.tax_id || ''} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                </div>
            </section>

            <section>
                <h3 style={{ margin: '0 0 1rem 0', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Dirección Fiscal</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Calle y Número</label>
                        <input name="address_street" defaultValue={settings?.address_street || ''} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Ciudad</label>
                            <input name="address_city" defaultValue={settings?.address_city || ''} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Estado</label>
                            <input name="address_state" defaultValue={settings?.address_state || ''} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Código Postal</label>
                        <input name="address_zip" defaultValue={settings?.address_zip || ''} style={{ width: '150px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                </div>
            </section>

            <section>
                <h3 style={{ margin: '0 0 1rem 0', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Contacto y Legal</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Nombre Responsable</label>
                            <input name="contact_name" defaultValue={settings?.contact_name || ''} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Teléfono</label>
                            <input name="contact_phone" defaultValue={settings?.contact_phone || ''} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Términos y Condiciones (Cotizaciones)</label>
                        <textarea name="terms_conditions" defaultValue={settings?.terms_conditions || ''} rows={4} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Texto Pie de Página</label>
                        <input name="footer_text" defaultValue={settings?.footer_text || ''} placeholder="Gracias por su preferencia..." style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                </div>
            </section>

            <button
                type="submit"
                disabled={loading}
                style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
        </form>
    );
}
