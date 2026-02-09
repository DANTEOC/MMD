'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
    { label: 'Catálogo', href: '/inventory/catalog' },
    { label: 'Almacenes', href: '/inventory/locations' },
    { label: 'Stock', href: '/inventory/stock' },
    { label: 'Compras', href: '/inventory/purchases' },
    { label: 'Movimientos', href: '/inventory/movements' },
    { label: 'Ajustes', href: '/inventory/adjustments' },
];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div style={{ padding: '0 2rem' }}>
            <div style={{
                marginBottom: '2rem',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                gap: '2rem'
            }}>
                {TABS.map(tab => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            style={{
                                padding: '1rem 0',
                                textDecoration: 'none',
                                color: isActive ? '#1976d2' : '#666',
                                borderBottom: isActive ? '2px solid #1976d2' : '2px solid transparent',
                                fontWeight: isActive ? 600 : 500,
                                fontSize: '0.95rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </Link>
                    )
                })}
            </div>
            {children}
        </div>
    );
}
