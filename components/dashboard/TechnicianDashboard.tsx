'use client';

import Link from 'next/link';
import { TechnicianStats } from '@/app/actions/technician';

interface TechnicianDashboardProps {
    stats: TechnicianStats;
    userName: string;
}

// Simple Inline Icons
const Icons = {
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#2196f3' }}>
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    ),
    ClipboardList: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff9800' }}>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 12h6"></path><path d="M9 16h6"></path><path d="M9 8h6"></path>
        </svg>
    ),
    PackageMinus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4caf50' }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line><line x1="16" y1="13" x2="8" y2="13"></line>
        </svg>
    ),
    Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    ),
    QrCode: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
        </svg>
    ),
    Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    )
};

export function TechnicianDashboard({ stats, userName }: TechnicianDashboardProps) {
    const cardStyle = {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #ddd',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        border: '1px solid transparent',
        textDecoration: 'none',
        fontWeight: 500,
        fontSize: '0.925rem',
        cursor: 'pointer',
        marginBottom: '0.75rem',
        transition: 'background-color 0.2s'
    };

    return (
        <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Hola, {userName}</h1>
                <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Tu resumen de hoy.</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {/* Active Orders */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Activas</span>
                        <Icons.Clock />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.activeOrdersCount}</div>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>En progreso</p>
                </div>

                {/* Pending Orders */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Pendientes</span>
                        <Icons.ClipboardList />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.pendingOrdersCount}</div>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>Por iniciar</p>
                </div>

                {/* Items Consumed */}
                <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>Material Utilizado</span>
                        <Icons.PackageMinus />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{stats.itemsConsumedToday}</div>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>Items consumidos hoy</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Acciones Rápidas</h2>

                <Link href="/work-orders/new" style={{ ...buttonStyle, backgroundColor: '#000', color: '#fff' }}>
                    <span style={{ marginRight: '0.75rem', display: 'flex' }}><Icons.Plus /></span>
                    Nueva Orden de Trabajo
                </Link>

                <Link href="/work-orders?scan=true" style={{ ...buttonStyle, backgroundColor: '#fff', border: '1px solid #ddd', color: '#333' }}>
                    <span style={{ marginRight: '0.75rem', display: 'flex' }}><Icons.QrCode /></span>
                    Escanear Equipo / Ubicación
                </Link>

                <Link href="/work-orders" style={{ ...buttonStyle, backgroundColor: '#f5f5f5', color: '#333' }}>
                    <span style={{ marginRight: '0.75rem', display: 'flex' }}><Icons.Search /></span>
                    Buscar Orden
                </Link>
            </div>
        </div>
    );
}
