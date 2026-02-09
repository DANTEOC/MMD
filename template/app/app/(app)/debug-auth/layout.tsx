import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth/guards'

export default async function AppLayout({ children }: { children: ReactNode }) {
    // Guard global del área privada
    await requireAuth()

    return (
        <html>
            <body>{children}</body>
        </html>
    )
}
