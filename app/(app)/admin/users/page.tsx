'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTenantUsers, toggleUserStatus } from '@/app/actions/users';
import CreateUserModal from './CreateUserModal';
import ChangePasswordModal from './ChangePasswordModal';
import { UserPlus, Lock, Ban, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<{ id: string, name: string } | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        const data = await getTenantUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`¿Estás seguro de ${currentStatus ? 'suspender' : 'activar'} este usuario?`)) return;
        await toggleUserStatus(userId, !currentStatus);
        loadUsers();
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Gestión de Usuarios</h1>
                    <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Administra el acceso y roles del equipo.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link
                        href="/dashboard"
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'white',
                            color: '#666',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            fontSize: '0.875rem'
                        }}
                    >
                        ← Dashboard
                    </Link>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <UserPlus size={18} /> Nuevo Usuario
                    </button>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                        <RefreshCw className="animate-spin" style={{ margin: '0 auto 1rem', display: 'block' }} />
                        Cargando usuarios...
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                        No hay usuarios registrados.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <style jsx>{`
                           th { text-align: left; padding: 1rem; background: #f9fafb; font-size: 0.75rem; text-transform: uppercase; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
                           td { padding: 1rem; border-bottom: 1px solid #f3f4f6; color: #374151; font-size: 0.9rem; vertical-align: middle; }
                        `}</style>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.user_id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#111827' }}>{user.profile.full_name || 'Sin Nombre'}</div>
                                            <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{user.profile.email}</div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                                backgroundColor: user.role_key === 'Admin' ? '#dcfce7' : '#e0f2fe',
                                                color: user.role_key === 'Admin' ? '#166534' : '#075985'
                                            }}>
                                                {user.role_key.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            {user.is_active ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.8rem', fontWeight: 500 }}>
                                                    <CheckCircle size={14} /> Activo
                                                </span>
                                            ) : (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '0.8rem', fontWeight: 500 }}>
                                                    <Ban size={14} /> Suspendido
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setSelectedUserForPassword({ id: user.user_id, name: user.profile.full_name })}
                                                    title="Cambiar Contraseña"
                                                    style={{ padding: '0.4rem', border: '1px solid #e5e7eb', borderRadius: '4px', background: 'white', color: '#4b5563', cursor: 'pointer' }}
                                                >
                                                    <Lock size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                                                    title={user.is_active ? 'Suspender' : 'Activar'}
                                                    style={{
                                                        padding: '0.4rem',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '4px',
                                                        background: 'white',
                                                        color: user.is_active ? '#dc2626' : '#16a34a',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {user.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showCreateModal && (
                <CreateUserModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); loadUsers(); }}
                />
            )}

            {selectedUserForPassword && (
                <ChangePasswordModal
                    userId={selectedUserForPassword.id}
                    userName={selectedUserForPassword.name}
                    onClose={() => setSelectedUserForPassword(null)}
                    onSuccess={() => { setSelectedUserForPassword(null); alert('Contraseña actualizada'); }}
                />
            )}
        </div>
    );
}
