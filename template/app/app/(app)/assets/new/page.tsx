import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { createAssetAction } from '@/app/actions/assets'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NewAssetPage() {
    const auth = await requireAuth()

    // Validar que sea Admin, Operador o Tecnico
    if (!['Admin', 'Operador', 'Tecnico'].includes(auth.roleKey)) {
        redirect('/forbidden')
    }

    const supabase = await createClient()

    // Obtener lista de clientes para el select
    const { data: clients } = await supabase
        .from('tenant_clients')
        .select('id, name')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/assets"
                    style={{ color: '#2196f3', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Volver a Activos
                </Link>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginTop: 0 }}>Nuevo Activo</h1>

                <form action={createAssetAction}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="client_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Cliente <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            id="client_id"
                            name="client_id"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clients?.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Nombre <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="ej. Sea Ray 280"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="asset_type" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Tipo <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            id="asset_type"
                            name="asset_type"
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">Seleccionar tipo...</option>
                            <option value="boat">Embarcación</option>
                            <option value="engine">Motor</option>
                            <option value="equipment">Equipo</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label htmlFor="make" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Marca
                            </label>
                            <input
                                id="make"
                                name="make"
                                type="text"
                                placeholder="ej. Yamaha"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="model" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Modelo
                            </label>
                            <input
                                id="model"
                                name="model"
                                type="text"
                                placeholder="ej. 200HP"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label htmlFor="year" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Año
                            </label>
                            <input
                                id="year"
                                name="year"
                                type="number"
                                min="1900"
                                max="2100"
                                placeholder="ej. 2020"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="serial" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Número de Serie
                            </label>
                            <input
                                id="serial"
                                name="serial"
                                type="text"
                                placeholder="ej. ABC123456"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Notas
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Guardar Activo
                        </button>
                        <Link
                            href="/assets"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#666',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                display: 'inline-block'
                            }}
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
