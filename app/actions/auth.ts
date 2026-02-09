'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Role-based Redirect Logic
    const { data: userRole } = await supabase
        .from('tenant_users')
        .select('role_key')
        .eq('user_id', authData.user.id)
        .single();

    if (userRole?.role_key === 'Tecnico') {
        // Find active work order (in_progress) assigned to this tech
        const { data: activeWO } = await supabase
            .from('tenant_work_orders')
            .select('id')
            .eq('assigned_to', authData.user.id)
            .eq('status', 'in_progress')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (activeWO) {
            redirect(`/work-orders/${activeWO.id}`);
        }
        // If no active WO, falls through to dashboard (which shows Technician Dashboard)
    }

    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
