import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

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
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className} style={{ margin: 0, padding: 0 }} suppressHydrationWarning={true}>
                {children}
            </body>
        </html>
    )
}
