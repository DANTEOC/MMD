'use client';

import { Printer, Download } from 'lucide-react';

export default function PrintControl() {
    return (
        <div className="no-print" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
                onClick={() => window.print()}
                style={{
                    backgroundColor: '#ea580c', // Orange/Premium color
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <Download size={18} />
                Descargar PDF
            </button>

            <button
                onClick={() => window.print()}
                style={{
                    backgroundColor: '#1f2937',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '50%',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    alignSelf: 'flex-end'
                }}
                title="Imprimir"
            >
                <Printer size={24} />
            </button>
        </div>
    );
}
