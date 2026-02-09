'use client'

import { deleteAssetAction } from '@/app/actions/assets'

export function DeleteAssetButton({ assetId }: { assetId: string }) {
    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar este activo? Esta acción no se puede deshacer.')) {
            return
        }
        await deleteAssetAction(assetId)
    }

    return (
        <form action={handleDelete}>
            <button
                type="submit"
                style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                }}
            >
                Eliminar Activo
            </button>
        </form>
    )
}
