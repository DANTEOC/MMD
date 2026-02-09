import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'MMD Maintenance',
    description: 'Sistema ERP/CRM Multi-tenant',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es">
            <body style={{ margin: 0, padding: 0 }}>
                {children}
            </body>
        </html>
    )
}
