import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth/guards';
import AppShell from '@/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: ReactNode }) {
    // Guard: protege toda el área privada (app)
    const { roleKey } = await requireAuth();

    // Fetch User Email for Profile UI
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <AppShell role={roleKey} userEmail={user?.email} userId={user?.id}>
            {children}
        </AppShell>
    );
}
