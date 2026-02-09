import Link from 'next/link';
import CreateWorkOrderForm from './CreateWorkOrderForm';

export default async function CreateWorkOrderPage({
    searchParams
}: {
    searchParams: Promise<{ mode?: string }>
}) {
    // Await params in newer Next.js or just use if synchronous in older (Next 15 implies async usually)
    const resolvedParams = await searchParams;
    const isQuoteMode = resolvedParams?.mode === 'quote';

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/work-orders" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>
                    ← Volver a la lista
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <h1 style={{ margin: 0 }}>{isQuoteMode ? 'Nueva Cotización' : 'Nueva Orden de Trabajo'}</h1>
                    {isQuoteMode && (
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#fff3e0',
                            color: '#ef6c00',
                            border: '1px solid #ffe0b2',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            MODO COTIZACIÓN
                        </span>
                    )}
                </div>
                {isQuoteMode && (
                    <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        Esta cotización no afectará el inventario ni será visible para técnicos hasta que se apruebe.
                    </p>
                )}
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <CreateWorkOrderForm initialMode={isQuoteMode ? 'quote' : 'order'} />
            </div>
        </div>
    );
}
