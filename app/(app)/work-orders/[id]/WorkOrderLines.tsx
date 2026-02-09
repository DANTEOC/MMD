'use client';

import { useState, useEffect } from 'react';
import { getWorkOrderLines, type WorkOrderLine } from '@/app/actions/work-order-lines';
import AddLineModal from '@/components/work-orders/AddLineModal';
import RegisterPaymentButton from '@/components/work-orders/RegisterPaymentButton';
import DirectPurchaseModal from '@/components/work-orders/DirectPurchaseModal';
import { formatCurrency, formatQuantity } from '@/lib/formatters';

type WorkOrderLinesProps = {
    workOrder: any;
    role: string;
    hideAddButtons?: boolean;
};

export default function WorkOrderLines({ workOrder, role, hideAddButtons = false }: WorkOrderLinesProps) {
    const [lines, setLines] = useState<WorkOrderLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    const isTechnician = role === 'Tecnico';
    const canAddLines = ['Admin', 'Supervisor', 'Tecnico'].includes(role);
    const showCosts = !isTechnician;
    const showMargin = role === 'Admin';

    useEffect(() => {
        loadLines();
    }, [workOrder.id]);

    const loadLines = async () => {
        setLoading(true);
        const data = await getWorkOrderLines(workOrder.id);
        setLines(data);
        setLoading(false);
    };

    const handleLineAdded = () => {
        setShowModal(false);
        loadLines();
        window.location.reload();
    };

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginTop: '2rem'
        }}>
            <style jsx>{`
                .desktop-view { display: block; }
                .mobile-view { display: none; }
                @media (max-width: 768px) {
                    .desktop-view { display: none; }
                    .mobile-view { display: block; }
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 1rem;
                }
                @media (max-width: 768px) {
                    .summary-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Líneas de Servicio</h2>
                {canAddLines && !hideAddButtons && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowPurchaseModal(true)}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#fff',
                                color: '#111827',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            + Compra Directa
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            + Agregar Stock/Servicio
                        </button>
                    </div>
                )}
            </div>

            {showCosts && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>

                    {/* Cost Grid */}
                    <div className="summary-grid" style={{
                        padding: '1rem',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Subtotal</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatCurrency(workOrder.subtotal || 0)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Materiales (Costo)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ff9800' }}>{formatCurrency(workOrder.cost_materials || 0)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Servicios (Costo)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2196f3' }}>{formatCurrency(workOrder.cost_services || 0)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Costo Total</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f44336' }}>{formatCurrency(workOrder.cost_total || 0)}</div>
                        </div>
                        {showMargin && (
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Margen</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: (workOrder.margin || 0) >= 0 ? '#4caf50' : '#f44336' }}>
                                    {formatCurrency(workOrder.margin || 0)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Payment Status Bar */}
                    {['Admin', 'Supervisor', 'Contador', 'Operador'].includes(role) && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem',
                            backgroundColor: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '8px'
                        }}>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#047857', marginBottom: '0.25rem' }}>Total Cliente</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#064e3b' }}>
                                        {formatCurrency(workOrder.total_amount || workOrder.subtotal || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#047857', marginBottom: '0.25rem' }}>Pagado</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                                        {formatCurrency(workOrder.amount_paid || 0)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#047857', marginBottom: '0.25rem' }}>Pendiente</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: ((workOrder.total_amount || 0) - (workOrder.amount_paid || 0)) > 1 ? '#dc2626' : '#059669' }}>
                                        {formatCurrency(Math.max(0, (workOrder.total_amount || workOrder.subtotal || 0) - (workOrder.amount_paid || 0)))}
                                    </div>
                                </div>
                            </div>

                            {['Admin', 'Supervisor', 'Contador'].includes(role) && (
                                <RegisterPaymentButton
                                    workOrderId={workOrder.id}
                                    totalAmount={workOrder.total_amount || workOrder.subtotal || 0}
                                    amountPaid={workOrder.amount_paid || 0}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cargando...</div>
            ) : lines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No hay líneas.
                </div>
            ) : (
                <>
                    {/* DESKTOP TABLE */}
                    <div className="desktop-view">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #ddd' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tipo</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Nombre</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cant.</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Unidad</th>
                                    {showCosts && <th style={{ padding: '0.75rem', textAlign: 'right' }}>P. Unit.</th>}
                                    {showCosts && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Costo U.</th>}
                                    {showCosts && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>}
                                    {showCosts && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Costo</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {lines.map((line, i) => (
                                    <tr key={`line-desktop-${line.id || i}`} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '2px 6px',
                                                backgroundColor: line.kind === 'SERVICE' ? '#e3f2fd' : '#fff3e0',
                                                color: line.kind === 'SERVICE' ? '#1976d2' : '#f57c00',
                                                borderRadius: '4px',
                                                fontSize: '0.7rem',
                                                fontWeight: 600
                                            }}>
                                                {line.kind === 'SERVICE' ? 'SVC' : 'MAT'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{line.name}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatQuantity(line.qty)}</td>
                                        <td style={{ padding: '0.75rem' }}>{line.unit}</td>
                                        {showCosts && <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(line.unit_price)}</td>}
                                        {showCosts && <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>{formatCurrency(line.cost_unit)}</td>}
                                        {showCosts && <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(line.line_total)}</td>}
                                        {showCosts && <td style={{ padding: '0.75rem', textAlign: 'right', color: '#666' }}>{formatCurrency(line.cost_total)}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARDS */}
                    <div className="mobile-view">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {lines.map((line, i) => (
                                <div key={`line-mobile-${line.id || i}`} style={{
                                    border: '1px solid #eee',
                                    borderRadius: '6px',
                                    padding: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{line.name}</span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            backgroundColor: line.kind === 'SERVICE' ? '#e3f2fd' : '#fff3e0',
                                            color: line.kind === 'SERVICE' ? '#1976d2' : '#f57c00'
                                        }}>
                                            {line.kind === 'SERVICE' ? 'SVC' : 'MAT'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                                        <span>Can: <strong>{formatQuantity(line.qty)}</strong> {line.unit}</span>
                                        {showCosts && <span>Total: <strong>{formatCurrency(line.line_total)}</strong></span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {showModal && (
                <AddLineModal
                    workOrderId={workOrder.id}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleLineAdded}
                />
            )}

            {showPurchaseModal && (
                <DirectPurchaseModal
                    workOrderId={workOrder.id}
                    onClose={() => setShowPurchaseModal(false)}
                    onSuccess={handleLineAdded}
                />
            )}
        </div>
    );
}
