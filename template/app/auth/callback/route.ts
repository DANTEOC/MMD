import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const supabase = await createClient()

    // Obtener el código de la URL si existe
    const code = requestUrl.searchParams.get('code')

    if (code) {
        // Intercambiar el código por una sesión
        await supabase.auth.exchangeCodeForSession(code)
    }

    // Siempre redirigir a reset-password
    // Si hay sesión, podrá cambiar la contraseña
    // Si no hay sesión, verá el error
    return NextResponse.redirect(`${requestUrl.origin}/auth/reset-password`)
}
