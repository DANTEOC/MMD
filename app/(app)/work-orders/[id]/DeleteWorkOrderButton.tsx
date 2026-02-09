'use client'

import { deleteWorkOrderAction } from '@/app/actions/work-orders'

export function DeleteWorkOrderButton({ workOrderId }: { workOrderId: string }) {
    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar esta orden? Esta acción no se puede deshacer.')) {
            return
        }
        await deleteWorkOrderAction(workOrderId)
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
                Eliminar Orden
            </button>
        </form>
    )
}
