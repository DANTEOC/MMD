'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Wrench,
    Box,
    ShoppingCart,
    CheckCircle,
    ClipboardList,
    History,
    FileText,
    ArrowLeft
} from 'lucide-react';

import AddLineModal from '@/components/work-orders/AddLineModal';
import DirectPurchaseModal from '@/components/work-orders/DirectPurchaseModal';
import WorkOrderLines from '@/app/(app)/work-orders/[id]/WorkOrderLines'; // Import directly to control props

interface MobileDetailLayoutProps {
    workOrder: any;
    role: string;
    infoContent: React.ReactNode;
    historyContent: React.ReactNode;
}

export function MobileDetailLayout({ workOrder, role, infoContent, historyContent }: MobileDetailLayoutProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'actions' | 'lines' | 'info' | 'history'>('actions');

    // Modal States
    const [showAddLineModal, setShowAddLineModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    const handleRefresh = () => {
        setShowAddLineModal(false);
        setShowPurchaseModal(false);
        router.refresh();
        // Give a small delay for DB propagation then reload strictly to ensure lines update? 
        // router.refresh() should be enough if Server Actions revalidatePath correctly.
        // We can also switch to 'lines' tab to show the result.
        setActiveTab('lines');
    };

    const navItemStyle = (tab: string) => ({
        flex: 1,
        padding: '0.8rem 0.2rem',
        textAlign: 'center' as const,
        borderBottom: activeTab === tab ? '3px solid #2563eb' : '1px solid #e5e7eb',
        color: activeTab === tab ? '#2563eb' : '#6b7280',
        fontWeight: activeTab === tab ? 600 : 500,
        cursor: 'pointer',
        backgroundColor: 'white',
        fontSize: '0.9rem',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.25rem'
    });

    return (
        <div style={{ paddingBottom: '80px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
            {/* Sticky Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '0.75rem 1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                {/* ... Header Content ... (same as before, skipping lines for brevity if unchanged, but ReplaceContent needs full match?) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/work-orders" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#374151' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {workOrder.title}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                            <span style={{ fontWeight: 600 }}>#{workOrder.id.substring(0, 6)}</span>
                            <span>•</span>
                            <span>{workOrder.asset?.name || 'Sin Activo'}</span>
                        </div>
                    </div>
                    <div style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid #dbeafe'
                    }}>
                        {workOrder.status === 'in_progress' ? 'EN PROCESO' : workOrder.status.replace('_', ' ').toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', position: 'sticky', top: '65px', zIndex: 40, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
                <div key="tab-actions" style={navItemStyle('actions')} onClick={() => setActiveTab('actions')}>
                    <Wrench size={18} /> Acciones
                </div>
                <div key="tab-lines" style={navItemStyle('lines')} onClick={() => setActiveTab('lines')}>
                    <ClipboardList size={18} /> Líneas
                </div>
                <div key="tab-info" style={navItemStyle('info')} onClick={() => setActiveTab('info')}>
                    <FileText size={18} /> Info
                </div>
                <div key="tab-history" style={navItemStyle('history')} onClick={() => setActiveTab('history')}>
                    <History size={18} /> Hist.
                </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: '1rem' }}>

                {/* ACTIONS TAB */}
                <div key="content-actions" style={{ display: activeTab === 'actions' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {/* ... Actions Buttons ... */}
                    <button
                        onClick={() => setShowAddLineModal(true)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            padding: '2rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer'
                        }}
                    >
                        <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '50%', color: '#2563eb' }}>
                            <Wrench size={32} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#374151' }}>+ Servicio</span>
                    </button>

                    <button
                        onClick={() => setShowAddLineModal(true)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            padding: '2rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer'
                        }}
                    >
                        <div style={{ padding: '0.75rem', backgroundColor: '#fff7ed', borderRadius: '50%', color: '#ea580c' }}>
                            <Box size={32} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#374151' }}>+ Material</span>
                    </button>

                    <button
                        onClick={() => setShowPurchaseModal(true)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            padding: '2rem 1rem', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer'
                        }}
                    >
                        <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '50%', color: '#16a34a' }}>
                            <ShoppingCart size={32} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#374151' }}>Compra Directa</span>
                    </button>

                    {/* Placeholder */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '1rem', opacity: 0.5
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
                            Tiempo Estimado: <br /><strong>{workOrder.estimated_time || 'No definido'}</strong>
                        </span>
                    </div>
                </div>

                {/* LINES TAB */}
                <div key="content-lines" style={{ display: activeTab === 'lines' ? 'block' : 'none' }}>
                    <WorkOrderLines
                        workOrder={workOrder}
                        role={role}
                        hideAddButtons={true}
                    />
                </div>

                {/* INFO TAB */}
                <div key="content-info" style={{ display: activeTab === 'info' ? 'block' : 'none' }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Descripción</span>
                            <p style={{ marginTop: '0.25rem', color: '#1f2937' }}>{workOrder.description}</p>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Prioridad</span>
                            <p style={{ marginTop: '0.25rem', fontWeight: 600 }}>{workOrder.priority?.toUpperCase()}</p>
                        </div>
                        {infoContent}
                    </div>
                </div>

                {/* HISTORY TAB */}
                <div key="content-history" style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
                    {historyContent}
                </div>
            </div>

            {/* Modals */}
            {showAddLineModal && (
                <AddLineModal
                    workOrderId={workOrder.id}
                    onClose={() => setShowAddLineModal(false)}
                    onSuccess={handleRefresh}
                />
            )}

            {showPurchaseModal && (
                <DirectPurchaseModal
                    workOrderId={workOrder.id}
                    onClose={() => setShowPurchaseModal(false)}
                    onSuccess={handleRefresh}
                />
            )}
        </div>
    );
}
