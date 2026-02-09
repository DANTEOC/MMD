'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav-config';
import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function BottomNav({ role, userEmail, userId }: { role: string, userEmail?: string, userId?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(role));
    // Max 3 main items + Profile/Menu
    // Actually typically 4 items + Menu or 5 items.
    // Let's take first 4 filtered items for bottom bar.
    const mainItems = filteredItems.slice(0, 4);
    const hasMore = filteredItems.length > 4 || true; // Always show menu for profile/logout

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/login');
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '64px',
                backgroundColor: 'white',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 50,
                paddingBottom: 'safe-area-inset-bottom'
            }}>
                {mainItems.map(item => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                color: isActive ? '#2196f3' : '#888',
                                fontSize: '0.7rem',
                                flex: 1
                            }}
                        >
                            <item.icon size={22} />
                            <span style={{ marginTop: '2px' }}>{item.label}</span>
                        </Link>
                    );
                })}

                {/* Menu/Profile Button */}
                <button
                    onClick={() => setDrawerOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: drawerOpen ? '#2196f3' : '#888',
                        fontSize: '0.7rem',
                        flex: 1
                    }}
                >
                    <Menu size={22} />
                    <span style={{ marginTop: '2px' }}>Menú</span>
                </button>
            </div>

            {/* Drawer Overlay */}
            {drawerOpen && (
                <div
                    onClick={() => setDrawerOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 60
                    }}
                >
                    {/* Drawer Content */}
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderTopLeftRadius: '16px',
                            borderTopRightRadius: '16px',
                            padding: '1.5rem',
                            animation: 'slideUp 0.3s ease'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={24} color="#666" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>Usuario</div>
                                <div style={{ fontSize: '0.85rem', color: '#666' }}>{userEmail}</div>
                                <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>
                                    ID: {userId ? userId.substring(0, 8) : '...'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase' }}>{role}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Rest of items if any */}
                            {filteredItems.slice(4).map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setDrawerOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        textDecoration: 'none',
                                        color: '#333',
                                        padding: '0.5rem'
                                    }}
                                >
                                    <item.icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            ))}

                            <button
                                onClick={handleLogout}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#d32f2f',
                                    padding: '0.5rem',
                                    fontSize: '1rem',
                                    width: '100%',
                                    textAlign: 'left'
                                }}
                            >
                                <LogOut size={20} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
