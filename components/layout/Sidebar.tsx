'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav-config';
import { ChevronLeft, ChevronRight, LogOut, User, Box } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Sidebar({ role, userEmail, userId }: { role: string, userEmail?: string, userId?: string }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(role));
    const mainItems = filteredItems.filter(item => !item.section);
    const bottomItems = filteredItems.filter(item => item.section === 'bottom');

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    return (
        <aside style={{
            width: collapsed ? '72px' : '260px',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'sticky',
            top: 0,
            left: 0,
            zIndex: 50,
            flexShrink: 0
        }}>
            {/* Header / Logo */}
            <div style={{
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                padding: collapsed ? '0' : '0 1.5rem',
                backgroundColor: '#fff',
                borderBottom: '1px solid #eee'
            }}>
                {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px',
                            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}>
                            <Box size={20} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#1a1a1a', letterSpacing: '-0.5px' }}>MMD</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        background: collapsed ? '#fff' : '#f5f5f5',
                        border: '1px solid #eee',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#666',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1.5rem 0.75rem', overflowY: 'auto' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {mainItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: collapsed ? '0.75rem' : '0.75rem 1rem',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        color: isActive ? '#1976d2' : '#5f6368',
                                        backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                                        textDecoration: 'none',
                                        borderRadius: '8px',
                                        fontWeight: isActive ? 600 : 500,
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                    title={collapsed ? item.label : ''}
                                >
                                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    {!collapsed && <span style={{ marginLeft: '1rem', fontSize: '0.95rem' }}>{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Bottom Settings Link */}
                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {bottomItems.map(item => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: collapsed ? '0.75rem' : '0.75rem 1rem',
                                            justifyContent: collapsed ? 'center' : 'flex-start',
                                            color: isActive ? '#1976d2' : '#5f6368',
                                            backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                                            textDecoration: 'none',
                                            borderRadius: '8px',
                                            fontWeight: isActive ? 600 : 500
                                        }}
                                        title={collapsed ? item.label : ''}
                                    >
                                        <item.icon size={22} />
                                        {!collapsed && <span style={{ marginLeft: '1rem', fontSize: '0.95rem' }}>{item.label}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            {/* User Card */}
            <div style={{ padding: '1rem' }}>
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: collapsed ? '0.75rem 0' : '1rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #eaeaea',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: collapsed ? 'center' : 'flex-start',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: '#e3f2fd', color: '#1976d2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            fontWeight: 600
                        }}>
                            {userEmail?.charAt(0).toUpperCase()}
                        </div>

                        {!collapsed && (
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {userEmail?.split('@')[0]}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {userEmail}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50' }}></span>
                                    {role}
                                </div>
                            </div>
                        )}
                    </div>

                    {!collapsed && (
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: '#fff0f0',
                                color: '#d32f2f',
                                border: '1px solid #ffcdd2',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                        >
                            <LogOut size={14} />
                            <span>Cerrar sesión</span>
                        </button>
                    )}

                    {collapsed && (
                        <button
                            onClick={handleLogout}
                            title="Cerrar Sessión"
                            style={{
                                width: '36px', height: '36px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: '#fff0f0',
                                color: '#d32f2f',
                                border: '1px solid #ffcdd2',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
