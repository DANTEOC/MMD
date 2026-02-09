import { logout } from '@/app/actions/auth'
import { requireAuth } from '@/lib/auth/guards'
import Link from 'next/link'
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { getTechnicianStats } from '@/app/actions/technician'
import { getAdminStats } from '@/app/actions/admin'

export default async function DashboardPage() {
    const auth = await requireAuth()

    // 🚀 Renderizado Condicional para Técnicos
    if (auth.roleKey === 'Tecnico') {
        const stats = await getTechnicianStats()
        // TODO: Obtener nombre real del usuario desde auth metadata o perfil
        return <div className="p-4 md:p-8 max-w-lg mx-auto md:max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="sr-only">Dashboard Técnico</h1>
                <form action={logout}>
                    <button type="submit" className="text-sm text-red-500 font-medium hover:text-red-700">
                        Cerrar Sesión
                    </button>
                </form>
            </div>
            <TechnicianDashboard stats={stats} userName="Técnico" />
        </div>
    }

    // 🏢 Dashboard para Admin y Supervisor
    if (['Admin', 'Supervisor'].includes(auth.roleKey)) {
        const stats = await getAdminStats();

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <AdminDashboard stats={stats} userName="Usuario" role={auth.roleKey} />
                </div>
            </div>
        )
    }

    // Default Fallback (Lectura / Otros)
    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Dashboard</h1>
                <form action={logout}>
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Cerrar Sesión
                    </button>
                </form>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p>Bienvenido al sistema. Rol: <strong>{auth.roleKey}</strong></p>
                <p className="text-sm text-gray-500 mt-2">Su rol tiene acceso de solo lectura o limitado.</p>

                <div className="mt-4">
                    <Link
                        href="/work-orders"
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#009688',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            display: 'inline-block'
                        }}
                    >
                        Ver Órdenes de Trabajo
                    </Link>
                </div>
            </div>
        </div>
    )
}
