'use client';

import { useState, useEffect } from 'react';
import {
    getReportWOFinancials,
    getReportInventoryConsumption,
    getReportLowStock
} from '@/app/actions/reports';

// Tabs Enum
type ReportTab = 'FINANCIALS' | 'CONSUMPTION' | 'LOW_STOCK';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('FINANCIALS');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Load Data
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = { startDate: startDate || undefined, endDate: endDate || undefined };
            let result;

            if (activeTab === 'FINANCIALS') {
                result = await getReportWOFinancials(filters);
            } else if (activeTab === 'CONSUMPTION') {
                result = await getReportInventoryConsumption(filters);
            } else if (activeTab === 'LOW_STOCK') {
                result = await getReportLowStock();
            }

            setData(result || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error loading report');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Effect to reload when tab changes
    useEffect(() => {
        // Reset filters when switching to Low Stock? Maybe not strict but good UX
        if (activeTab === 'LOW_STOCK') {
            setStartDate('');
            setEndDate('');
        }
        loadData();
    }, [activeTab]);

    // Simple CSV Export
    const handleExport = () => {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (_, value) => value === null ? '' : value)).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Reportes Operativos</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                Vista consolidada de indicadores clave.
            </p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #ddd', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('FINANCIALS')}
                    style={tabStyle(activeTab === 'FINANCIALS')}
                >
                    💰 Costos Financieros
                </button>
                <button
                    onClick={() => setActiveTab('CONSUMPTION')}
                    style={tabStyle(activeTab === 'CONSUMPTION')}
                >
                    📦 Consumo Inventario
                </button>
                <button
                    onClick={() => setActiveTab('LOW_STOCK')}
                    style={tabStyle(activeTab === 'LOW_STOCK')}
                >
                    ⚠️ Stock Bajo
                </button>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {activeTab !== 'LOW_STOCK' && (
                    <>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#666' }}>
                                Desde
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#666' }}>
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <button onClick={loadData} style={buttonPrimaryStyle}>
                            Aplicar Filtros
                        </button>
                    </>
                )}

                <div style={{ flex: 1 }} /> {/* Spacer */}

                <button onClick={handleExport} disabled={data.length === 0} style={buttonSecondaryStyle}>
                    📥 Exportar CSV
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {/* Data Table */}
            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Cargando datos...</div>
            ) : data.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666', border: '1px dashed #ddd', borderRadius: '8px' }}>
                    No hay datos para mostrar con los filtros actuales.
                </div>
            ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead style={{ backgroundColor: '#f9fafb' }}>
                            <tr>
                                {getColumns(activeTab).map(col => (
                                    <th key={col.key} style={thStyle}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                                    {getColumns(activeTab).map(col => (
                                        <td key={col.key} style={tdStyle}>
                                            {formatValue(row[col.key], col.format)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Helpers

function getColumns(tab: ReportTab) {
    switch (tab) {
        case 'FINANCIALS':
            return [
                { key: 'created_at', label: 'Fecha', format: 'date' },
                { key: 'title', label: 'Orden' },
                { key: 'status', label: 'Estatus' },
                { key: 'subtotal', label: 'Venta', format: 'currency' },
                { key: 'cost_total', label: 'Costo', format: 'currency' },
                { key: 'margin', label: 'Margen $', format: 'currency' },
                { key: 'margin_percent', label: 'Margen %', format: 'percent' },
            ];
        case 'CONSUMPTION':
            return [
                { key: 'movement_date', label: 'Fecha', format: 'date' },
                { key: 'item_name', label: 'Material' },
                { key: 'location_name', label: 'Ubicación' },
                { key: 'quantity', label: 'Cant.' },
                { key: 'estimated_total_cost', label: 'Costo Est.', format: 'currency' },
                { key: 'reference', label: 'Ref. Orden' },
            ];
        case 'LOW_STOCK':
            return [
                { key: 'item_name', label: 'Artículo' },
                { key: 'sku', label: 'SKU' },
                { key: 'min_stock', label: 'Stock Mín.' },
                { key: 'current_stock', label: 'Stock Actual', format: 'stock_alert' },
                { key: 'shortage', label: 'Déficit' },
            ];
    }
}

function formatValue(value: any, format?: string) {
    if (value === null || value === undefined) return '-';
    if (format === 'date') return new Date(value).toLocaleDateString() + ' ' + new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (format === 'currency') return `$${Number(value).toFixed(2)}`;
    if (format === 'percent') return `${Number(value).toFixed(1)}%`;
    if (format === 'stock_alert') {
        const val = Number(value);
        return <span style={{ color: val === 0 ? 'red' : 'orange', fontWeight: 'bold' }}>{val}</span>;
    }
    return value;
}

// Styles
const tabStyle = (active: boolean) => ({
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    color: active ? '#2563eb' : '#666',
    fontWeight: active ? 600 : 400,
    fontSize: '1rem'
});

const inputStyle = {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '0.875rem'
};

const buttonPrimaryStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 500,
    cursor: 'pointer'
};

const buttonSecondaryStyle = {
    padding: '0.5rem 1rem',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontWeight: 500,
    cursor: 'pointer'
};

const thStyle = {
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    textTransform: 'uppercase' as const,
    color: '#666',
    fontWeight: 600
};

const tdStyle = {
    padding: '0.75rem 1rem',
    color: '#333'
};
