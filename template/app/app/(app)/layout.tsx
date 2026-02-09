import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth/guards'

export default async function AppLayout({ children }: { children: ReactNode }) {
    // Guard: protege toda el área privada (app)
    // Requiere: usuario autenticado + tenant activo
    await requireAuth()

    return <>{children}</>
}
