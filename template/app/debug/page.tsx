import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
    const supabase = await createClient()

    // Obtener sesión
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    let tenantUsers = null
    let tenantUsersError = null

    if (session?.user) {
        // Obtener tenant_users
        const result = await supabase
            .from('tenant_users')
            .select('*')
            .eq('user_id', session.user.id)

        tenantUsers = result.data
        tenantUsersError = result.error
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Debug Auth</h1>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h2>Sesión</h2>
                {sessionError && <p style={{ color: 'red' }}>Error: {sessionError.message}</p>}
                {session ? (
                    <pre style={{ overflow: 'auto' }}>{JSON.stringify({
                        user_id: session.user.id,
                        email: session.user.email,
                        role: session.user.role,
                    }, null, 2)}</pre>
                ) : (
                    <p style={{ color: 'red' }}>No hay sesión activa</p>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h2>Tenant Users</h2>
                {tenantUsersError && <p style={{ color: 'red' }}>Error: {tenantUsersError.message}</p>}
                {tenantUsers ? (
                    <pre style={{ overflow: 'auto' }}>{JSON.stringify(tenantUsers, null, 2)}</pre>
                ) : (
                    <p>No se pudo obtener tenant_users</p>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <a href="/login" style={{ color: '#2196f3' }}>← Volver a Login</a>
            </div>
        </div>
    )
}
