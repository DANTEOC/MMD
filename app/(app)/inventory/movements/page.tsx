import { getMovements } from '@/app/actions/inventory';
import MovementsList from './MovementsList';
import { requireAuth } from '@/lib/auth/guards';

export default async function MovementsPage() {
    const movements = await getMovements();
    const { roleKey } = await requireAuth();

    return <MovementsList movements={movements} roleKey={roleKey} />;
}
