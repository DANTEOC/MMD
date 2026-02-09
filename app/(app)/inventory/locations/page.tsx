import { getLocations } from '@/app/actions/inventory';
import CreateLocationButton from './CreateLocationButton';
import LocationGrid from './LocationGrid';
import { requireAuth } from '@/lib/auth/guards';

export default async function LocationsPage() {
    const locations = await getLocations();
    const { roleKey } = await requireAuth();
    const canEdit = ['Admin', 'Supervisor'].includes(roleKey);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Almacenes y Ubicaciones</h2>
                {canEdit && <CreateLocationButton />}
            </div>

            <LocationGrid locations={locations} canEdit={canEdit} />
        </div>
    );
}
