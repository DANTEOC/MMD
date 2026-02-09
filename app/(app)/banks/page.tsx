import { getBanks } from '@/app/actions/banks';
import { requireAuth } from '@/lib/auth/guards';
import { BankList } from '@/components/banks/bank-list';
import { BanksHeader } from '@/components/banks/BanksHeader';

export const metadata = {
    title: 'Bancos | MMD Maintenance',
    description: 'Gestión de Cuentas Bancarias'
};

export default async function BanksPage() {
    const auth = await requireAuth();
    const banks = await getBanks();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <BanksHeader banks={banks} />
            <BankList banks={banks} role={auth.roleKey} />
        </div>
    );
}
