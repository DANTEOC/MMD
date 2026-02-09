import { requireAuth } from '@/lib/auth/guards';
import { getCashFlow } from '@/app/actions/treasury';
import Link from 'next/link';
import CashFlowTabs from './CashFlowTabs';

export default async function CashFlowPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const auth = await requireAuth();
    if (auth.roleKey === 'Tecnico') return <div>Acceso Denegado</div>;

    const params = await searchParams;
    // Default to today in local time... Server time might differ. 
    // Ideally client sends today's date or defaults to server today.
    // For simplicity: default to server current string YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const date = params?.date || today;

    const data = await getCashFlow(date);

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Caja Diaria</h1>

                <form style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.9rem', color: '#666' }}>Fecha:</label>
                    <input
                        type="date"
                        name="date"
                        defaultValue={date}
                        style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Ver
                    </button>
                    {date !== today && (
                        <Link href="/reports/cash-flow" style={{ fontSize: '0.9rem', color: '#2196f3', textDecoration: 'none', marginLeft: '0.5rem' }}>
                            Ir a Hoy
                        </Link>
                    )}
                </form>
            </div>

            <CashFlowTabs initialData={data} date={date} />
        </div>
    );
}
