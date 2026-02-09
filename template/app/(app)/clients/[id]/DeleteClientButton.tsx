'use client'

import { deleteClient } from '@/app/actions/clients'

export function DeleteClientButton({ clientId }: { clientId: string }) {
    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
            return
        }
        await deleteClient(clientId)
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
                Eliminar Cliente
            </button>
        </form>
    )
}
