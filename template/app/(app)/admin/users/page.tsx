import { requireAdmin } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { addOrUpdateMembership } from '@/app/actions/users'
import Link from 'next/link'
import InviteUserForm from './InviteUserForm'
import RevokeInviteButton from './RevokeInviteButton'
import ResendInviteButton from './ResendInviteButton'
import CopyLinkButton from './CopyLinkButton'

export default async function AdminUsersPage() {
    const auth = await requireAdmin()
    const supabase = await createClient()

    // Obtener miembros del tenant activo
    const { data: members, error } = await supabase
        .from('tenant_users')
        .select(`
            id,
            user_id,
            role_key,
            is_active,
            created_at,
            updated_at
        `)
        .eq('tenant_id', auth.tenantId)
        .order('created_at', { ascending: false })

    // Obtener invitaciones activas del tenant (pending y accepted)
    const { data: invites } = await supabase
        .from('tenant_invites')
        .select('*')
        .eq('tenant_id', auth.tenantId)
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Gestión de Usuarios</h1>
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

            {/* Formulario para agregar/actualizar membership */}
            <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ marginTop: 0 }}>Agregar Usuario al Tenant</h2>
                <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    El usuario debe existir en Supabase Auth. Ingresa su UUID.
                </p>

                <form action={addOrUpdateMembership}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 150px auto', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label htmlFor="user_id" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                User ID (UUID)
                            </label>
                            <input
                                id="user_id"
                                name="user_id"
                                type="text"
                                required
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontFamily: 'monospace',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label htmlFor="role_key" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Rol
                            </label>
                            <select
                                id="role_key"
                                name="role_key"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="Lectura">Lectura</option>
                                <option value="Tecnico">Técnico</option>
                                <option value="Operador">Operador</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    value="true"
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '0.875rem' }}>Activo</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Agregar/Actualizar
                        </button>
                    </div>
                </form>
            </div>

            {/* Formulario de invitaciones por email */}
            <InviteUserForm tenantId={auth.tenantId} />

            {/* Lista de invitaciones pendientes */}
            {invites && invites.length > 0 && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    marginBottom: '2rem'
                }}>
                    <h2 style={{ margin: 0, padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                        Invitaciones ({invites.length})
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Rol</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Delivery</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Estado</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Creado</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Expira</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map((invite) => {
                                    const isExpired = new Date(invite.expires_at) < new Date();
                                    const statusColor =
                                        invite.status === 'accepted' ? '#4caf50' :
                                            invite.status === 'pending' && !isExpired ? '#2196f3' :
                                                invite.status === 'revoked' ? '#f44336' :
                                                    '#ff9800'; // expired

                                    return (
                                        <tr key={invite.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                                {invite.email}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1565c0',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500
                                                }}>
                                                    {invite.role_key}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {invite.delivery && (
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        backgroundColor: invite.delivery === 'email' ? '#4caf50' : '#ff9800',
                                                        color: 'white',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500
                                                    }}>
                                                        {invite.delivery === 'email' ? '✉️ EMAIL' : '🔗 LINK'}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    backgroundColor: statusColor,
                                                    color: 'white',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500
                                                }}>
                                                    {isExpired && invite.status === 'pending' ? 'expirado' : invite.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                                                {new Date(invite.created_at).toLocaleString('es-MX')}
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: isExpired ? '#f44336' : '#666' }}>
                                                {new Date(invite.expires_at).toLocaleString('es-MX')}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {invite.status !== 'accepted' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                        <ResendInviteButton inviteId={invite.id} />
                                                        {invite.delivery === 'manual_link' && (
                                                            <CopyLinkButton inviteId={invite.id} />
                                                        )}
                                                        <RevokeInviteButton inviteId={invite.id} />
                                                    </div>
                                                )}
                                                {invite.status === 'accepted' && (
                                                    <span style={{ color: '#999', fontSize: '0.75rem' }}>Aceptada</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Lista de miembros */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <h2 style={{ margin: 0, padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                    Miembros del Tenant ({members?.length || 0})
                </h2>

                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828' }}>
                        Error: {error.message}
                    </div>
                )}

                {members && members.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>User ID</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Rol</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.875rem' }}>Activo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem' }}>Creado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {member.user_id}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: member.role_key === 'Admin' ? '#4caf50' : '#2196f3',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500
                                            }}>
                                                {member.role_key}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {member.is_active ? (
                                                <span style={{ color: '#4caf50', fontWeight: 600 }}>✓</span>
                                            ) : (
                                                <span style={{ color: '#f44336', fontWeight: 600 }}>✗</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                                            {new Date(member.created_at).toLocaleString('es-MX')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                        No hay miembros en este tenant
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    <strong>Nota:</strong> Para obtener el UUID de un usuario, ve a Supabase Dashboard → Authentication → Users y copia el ID.
                </p>
            </div>
        </div>
    )
}
