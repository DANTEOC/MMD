'use client'

import { useState } from 'react'
import { ClientForm } from './client-form'
import { ClientAssetsList } from './client-assets-list'
import { ClientWorkOrdersList } from './client-work-orders-list'
import Link from 'next/link'

type Tab = 'details' | 'assets' | 'work-orders' | 'quotes'

interface ClientDetailViewProps {
    client: any
    assets: any[]
    workOrders: any[]
    canEdit: boolean
    canDelete: boolean
}

export function ClientDetailView({ client, assets, workOrders, canEdit, canDelete }: ClientDetailViewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('details')

    const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
        { id: 'details', label: 'General', icon: '📋' },
        { id: 'assets', label: 'Activos', icon: '⛵', count: assets.length },
        { id: 'work-orders', label: 'Órdenes', icon: '🛠️', count: workOrders.filter(o => o.status !== 'quote').length },
        { id: 'quotes', label: 'Cotizaciones', icon: '📄', count: workOrders.filter(o => o.status === 'quote').length },
    ]

    const serviceOrders = workOrders.filter(o => o.status !== 'quote')
    const quotes = workOrders.filter(o => o.status === 'quote')

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link
                        href="/clients"
                        style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}
                    >
                        ← Volver a Clientes
                    </Link>
                    <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{client.name}</h1>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                        {client.email} {client.phone && `• ${client.phone}`}
                    </p>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid #ddd',
                marginBottom: '2rem',
                overflowX: 'auto'
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 1.25rem',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            color: activeTab === tab.id ? '#2196f3' : '#666',
                            borderBottom: activeTab === tab.id ? '2px solid #2196f3' : '2px solid transparent',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tab.count !== undefined && (
                            <span style={{
                                backgroundColor: activeTab === tab.id ? '#e3f2fd' : '#f5f5f5',
                                color: activeTab === tab.id ? '#1976d2' : '#666',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '0.75rem'
                            }}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'details' && (
                    <ClientForm client={client} canEdit={canEdit} canDelete={canDelete} />
                )}

                {activeTab === 'assets' && (
                    <ClientAssetsList clientId={client.id} assets={assets} />
                )}

                {activeTab === 'work-orders' && (
                    <ClientWorkOrdersList clientId={client.id} orders={serviceOrders} type="service" />
                )}

                {activeTab === 'quotes' && (
                    <ClientWorkOrdersList clientId={client.id} orders={quotes} type="quote" />
                )}
            </div>
        </div>
    )
}
