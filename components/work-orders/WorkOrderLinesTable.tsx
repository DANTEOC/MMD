'use client';

import { formatCurrency, formatQuantity } from '@/lib/formatters';

type WorkOrderLine = {
    id: string;
    kind: 'SERVICE' | 'MATERIAL';
    name: string;
    qty: number;
    unit: string;
    unit_price: number;
    cost_unit: number;
};

type WorkOrderLinesTableProps = {
    lines: WorkOrderLine[];
    showFinancials: boolean; // true for Admin/Supervisor, false for Technician
    onEdit?: (lineId: string) => void;
    onDelete?: (lineId: string) => void;
};

export default function WorkOrderLinesTable({
    lines,
    showFinancials,
    onEdit,
    onDelete
}: WorkOrderLinesTableProps) {
    const calculateLineTotal = (line: WorkOrderLine) => {
        return line.qty * line.unit_price;
    };

    const calculateSubtotal = () => {
        return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
    };

    const calculateTax = () => {
        return calculateSubtotal() * 0.16;
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax();
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Desktop Table */}
            <div className="desktop-table-view">
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>
                                Tipo
                            </th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>
                                Nombre
                            </th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>
                                Cantidad
                            </th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                Unidad
                            </th>
                            {showFinancials && (
                                <>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Precio
                                    </th>
                                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>
                                        Total
                                    </th>
                                </>
                            )}
                            {(onEdit || onDelete) && (
                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((line) => (
                            <tr key={line.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.75rem' }}>
                                    {line.kind === 'SERVICE' ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.25rem' }}>🔧</span>
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>Servicio</span>
                                        </span>
                                    ) : (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.25rem' }}>📦</span>
                                            <span style={{ fontSize: '0.75rem', color: '#666' }}>Producto</span>
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '0.75rem' }}>{line.name}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                    {formatQuantity(line.qty)}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{line.unit}</td>
                                {showFinancials && (
                                    <>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                            {formatCurrency(line.unit_price)}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                            {formatCurrency(calculateLineTotal(line))}
                                        </td>
                                    </>
                                )}
                                {(onEdit || onDelete) && (
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(line.id)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#e3f2fd',
                                                        color: '#1976d2',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(line.id)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: '#ffebee',
                                                        color: '#c62828',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="mobile-cards-view">
                {lines.map((line) => (
                    <div
                        key={line.id}
                        style={{
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            border: '1px solid #eee'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>
                                    {line.kind === 'SERVICE' ? '🔧' : '📦'}
                                </span>
                                <span style={{ fontWeight: 600 }}>{line.name}</span>
                            </span>
                            {(onEdit || onDelete) && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(line.id)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: '#e3f2fd',
                                                color: '#1976d2',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✏️
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(line.id)}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                backgroundColor: '#ffebee',
                                                color: '#c62828',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            <div>Cantidad: <strong>{formatQuantity(line.qty)} {line.unit}</strong></div>
                            {showFinancials && (
                                <>
                                    <div>Precio: <strong>{formatCurrency(line.unit_price)}</strong></div>
                                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #eee' }}>
                                        Total: <strong>{formatCurrency(calculateLineTotal(line))}</strong>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Financial Summary (only if showFinancials) */}
            {showFinancials && lines.length > 0 && (
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    maxWidth: '300px',
                    marginLeft: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Sub-Total:</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Impuesto 16%:</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatCurrency(calculateTax())}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.5rem',
                        borderTop: '2px solid #ddd',
                        fontWeight: 600,
                        fontSize: '1.125rem'
                    }}>
                        <span>Total:</span>
                        <span style={{ fontFamily: 'monospace' }}>{formatCurrency(calculateTotal())}</span>
                    </div>
                </div>
            )}

            <style jsx>{`
                .mobile-cards-view {
                    display: block;
                }
                .desktop-table-view {
                    display: none;
                }
                @media (min-width: 768px) {
                    .mobile-cards-view {
                        display: none;
                    }
                    .desktop-table-view {
                        display: block;
                    }
                }
            `}</style>
        </div>
    );
}
