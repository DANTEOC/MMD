import Link from 'next/link';
import CreatePurchaseForm from './CreatePurchaseForm';

export default function CreatePurchasePage() {
    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/inventory/purchases" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>
                    ← Volver a Compras
                </Link>
                <h1 style={{ marginTop: '0.5rem' }}>Nueva Compra</h1>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <CreatePurchaseForm />
            </div>
        </div>
    );
}
