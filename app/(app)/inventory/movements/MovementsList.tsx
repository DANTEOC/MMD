'use client';

import { useState } from 'react';
import StockActionsButtons from '../stock/StockActionsButtons';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightCircle } from 'lucide-react';

export default function MovementsList({ movements, roleKey }: { movements: any[], roleKey: string }) {
    const [filterType, setFilterType] = useState('ALL');
    const [search, setSearch] = useState('');

    const filtered = movements.filter(m => {
        const matchesType = filterType === 'ALL' || m.movement_type === filterType;
        const matchesSearch = search === '' ||
            m.item?.name.toLowerCase().includes(search.toLowerCase()) ||
            m.reference?.toLowerCase().includes(search.toLowerCase()) ||
            m.user?.email.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'IN': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2e7d32' }}><ArrowDownCircle size={16} /> Entrada</span>;
            case 'OUT': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c62828' }}><ArrowUpCircle size={16} /> Salida</span>;
            case 'TRANSFER': return <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1565c0' }}><ArrowRightCircle size={16} /> Transf.</span>;
            default: return type;
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>Historial</h2>

                    <input
                        placeholder="Buscar por item, ref, usuario..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', width: '250px' }}
                    />

                    <select
                        value={filterType} onChange={e => setFilterType(e.target.value)}
                        style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="ALL">Todos</option>
                        <option value="IN">Entradas</option>
                        <option value="OUT">Salidas</option>
                        <option value="TRANSFER">Transferencias</option>
                    </select>
                </div>

                <StockActionsButtons roleKey={roleKey} />
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Fecha</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Tipo</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Item</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Origen</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Destino</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563', textAlign: 'right' }}>Cantidad</th>
                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#4b5563' }}>Ref. / Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No hay movimientos encontrados
                                </td>
                            </tr>
                        ) : (
                            filtered.map((m: any) => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#666' }}>
                                        {new Date(m.created_at).toLocaleDateString('es-MX')} {new Date(m.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                                        {getTypeLabel(m.movement_type)}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{m.item?.name}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{m.from?.name || '-'}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{m.to?.name || '-'}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                                        {Number(m.quantity).toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>{m.item?.unit}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <div style={{ fontSize: '0.85rem' }}>{m.reference}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                            {/* Mostrar ID of Performed By si no hay user object, o fallback */}
                                            {m.user?.email?.split('@')[0] || 'Usuario'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
