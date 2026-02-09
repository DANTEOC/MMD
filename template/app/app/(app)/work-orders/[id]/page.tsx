import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { updateWorkOrderAction } from '@/app/actions/work-orders'
import { DeleteWorkOrderButton } from './DeleteWorkOrderButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    open: 'Abierta',
    in_progress: 'En Progreso',
    completed: 'Completada',
    cancelled: 'Cancelada',
}

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
    const auth = await requireAuth()
    const supabase = await createClient()

    const { data: workOrder, error } = await supabase
        .from('tenant_work_orders')
        .select(`
            *,
            tenant_clients (
                id,
                name
            ),
            tenant_assets (
                id,
                name
            )
        `)
        .eq('id', params.id)
        .eq('tenant_id', auth.tenantId)
        .single()

    if (error || !workOrder) {
        notFound()
    }

    // Obtener clientes
    const { data: clients } = await supabase
        .from('tenant_clients')
        .select('id, name')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    // Obtener activos
    const { data: assets } = await supabase
        .from('tenant_assets')
        .select('id, name, client_id')
        .eq('tenant_id', auth.tenantId)
        .order('name', { ascending: true })

    // Obtener técnicos (usuarios con rol Tecnico del tenant)
    const { data: technicians } = await supabase
        .from('tenant_users')
        .select('user_id')
        .eq('tenant_id', auth.tenantId)
        .eq('role_key', 'Tecnico')
        .eq('is_active', true)

    // Determinar permisos
    const isAdmin = auth.roleKey === 'Admin'
    const isOperador = auth.roleKey === 'Operador'
    const isAssignedTech = auth.roleKey === 'Tecnico' && workOrder.assigned_to === auth.userId
    const canEdit = isAdmin || isOperador || isAssignedTech
    const canDelete = isAdmin
    const canAssign = isAdmin || isOperador

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link
                    href="/work-orders"
                    style={{ color: '#2196f3', textDecoration: 'none', fontSize: '0.875rem' }}
                >
                    ← Volver a Órdenes
                </Link>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h1 style={{ marginTop: 0 }}>
                    {canEdit ? 'Editar Orden de Servicio' : 'Detalle de Orden'}
                </h1>

                <form action={updateWorkOrderAction.bind(null, workOrder.id)}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="client_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Cliente <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <select
                            id="client_id"
                            name="client_id"
                            required
                            defaultValue={workOrder.client_id}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        >
                            {clients?.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="asset_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Activo
                        </label>
                        <select
                            id="asset_id"
                            name="asset_id"
                            defaultValue={workOrder.asset_id || ''}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        >
                            <option value="">Sin activo específico</option>
                            {assets?.map((asset) => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Título <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            defaultValue={workOrder.title}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Descripción
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={6}
                            defaultValue={workOrder.description || ''}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="status" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Estado
                        </label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={workOrder.status}
                            disabled={!canEdit}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                boxSizing: 'border-box',
                                backgroundColor: canEdit ? 'white' : '#f5f5f5'
                            }}
                        >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {canAssign && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label htmlFor="assigned_to" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Asignar a Técnico
                            </label>
                            <select
                                id="assigned_to"
                                name="assigned_to"
                                defaultValue={workOrder.assigned_to || ''}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">Sin asignar</option>
                                {technicians?.map((tech) => (
                                    <option key={tech.user_id} value={tech.user_id}>
                                        {tech.user_id}
                                    </option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                                Solo técnicos del tenant pueden ser asignados
                            </p>
                        </div>
                    )}

                    {canEdit && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            <button
                                type="submit"
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Guardar Cambios
                            </button>
                            <Link
                                href="/work-orders"
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
                    )}
                </form>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem 0' }}>
                        <strong>Creada:</strong> {new Date(workOrder.created_at).toLocaleString('es-MX')}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                        <strong>Actualizada:</strong> {new Date(workOrder.updated_at).toLocaleString('es-MX')}
                    </p>
                </div>

                {canDelete && (
                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                        <h3 style={{ color: '#f44336', marginBottom: '1rem' }}>Zona de Peligro</h3>
                        <DeleteWorkOrderButton workOrderId={workOrder.id} />
                    </div>
                )}
            </div>
        </div>
    )
}
