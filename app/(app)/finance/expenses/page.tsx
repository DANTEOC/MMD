import { requireAuth } from '@/lib/auth/guards';
import { getExpenses } from '@/app/actions/finance';
import { getProviders } from '@/app/actions/providers';
import ExpensesList from '@/components/finance/expenses-list';

export const metadata = {
    title: 'Gastos | MMD Maintenance',
    description: 'Registro de gastos y compras',
};

export default async function ExpensesPage() {
    const auth = await requireAuth();

    // Fetch data in parallel
    const [expenses, providers] = await Promise.all([
        getExpenses(),
        getProviders()
    ]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'system-ui' }}>
                    Gastos y Compras
                </h1>
                <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                    Control de egresos, pagos a proveedores y caja chica.
                </p>
            </div>

            <ExpensesList expenses={expenses} providers={providers} role={auth.roleKey} />
        </div>
    );
}
