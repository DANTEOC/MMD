'use client';

import Link from 'next/link';
import { AdminStats } from '@/app/actions/admin';

interface AdminDashboardProps {
    stats: AdminStats;
    userName: string;
    role: string;
}

export function AdminDashboard({ stats, userName, role }: AdminDashboardProps) {
    const isAdmin = role === 'Admin';

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard {role}</h1>
                        <p style={{ color: '#666', marginTop: '0.25rem' }}>Resumen operativo y alertas.</p>
                    </div>
                    {isAdmin && (
                        <Link
                            href="/reports"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '0.5rem 1rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                textDecoration: 'none',
                                color: '#333',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                                <line x1="12" y1="20" x2="12" y2="10"></line>
                                <line x1="18" y1="20" x2="18" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="16"></line>
                            </svg>
                            Ver Reportes Financieros
                        </Link>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Active Orders */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Órdenes Activas</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196f3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.activeOrdersCount}</div>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>En progreso</p>
                </div>

                {/* Pending Orders */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Pendientes</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            <path d="M9 14h6"></path>
                            <path d="M9 10h6"></path>
                            <path d="M9 18h6"></path>
                        </svg>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.pendingOrdersCount}</div>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Por iniciar</p>
                </div>

                {/* Low Stock */}
                <div style={{
                    backgroundColor: stats.lowStockCount > 0 ? '#fff5f5' : 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: stats.lowStockCount > 0 ? '1px solid #ffcdd2' : '1px solid #eee'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Stock Bajo</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stats.lowStockCount > 0 ? "#f44336" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.lowStockCount > 0 ? "#d32f2f" : "inherit" }}>{stats.lowStockCount}</div>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>Items &lt; 10 unidades</p>
                </div>

                {/* Quick Reports */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#333' }}>Reportes</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#666', marginTop: '0.5rem' }}>Acceso Rápido</div>
                    <p style={{ fontSize: '0.75rem', color: '#999' }}>Consumo, Costos...</p>
                </div>
            </div>

            {/* Shortcuts & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Shortcuts */}
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Accesos Directos</h3>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <Link href="/work-orders" style={{ display: 'block', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: 'white' }}>
                            <div style={{ fontWeight: 500 }}>Gestionar Órdenes de Trabajo</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>Ver listado completo, asignar técnicos...</div>
                        </Link>
                        <Link href="/inventory" style={{ display: 'block', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: 'white' }}>
                            <div style={{ fontWeight: 500 }}>Inventario</div>
                            <div style={{ fontSize: '0.875rem', color: '#666' }}>Ver existencias, movimientos...</div>
                        </Link>
                        {isAdmin && (
                            <Link href="/admin/users" style={{ display: 'block', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: 'white' }}>
                                <div style={{ fontWeight: 500 }}>Usuarios</div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>Gestionar accesos y roles</div>
                            </Link>
                        )}
                    </div>
                </div>

                {/* System Status */}
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Estado del Sistema</h3>
                    <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee', fontSize: '0.875rem', lineHeight: '1.6' }}>
                        <p>✅ <strong>Conectado a Tenant:</strong> Activo</p>
                        <p>ℹ️ <strong>Rol Actual:</strong> {role}</p>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>Las métricas se actualizan en tiempo real al recargar.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
