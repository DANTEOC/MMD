import { requireAuth } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ClientDetailView } from '@/components/clients/client-detail-view'


export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth()
    const supabase = await createClient()

    // CAMBIO: Await params antes de usar
    const { id } = await params

    // 1. Fetch Client, Assets, and Work Orders in parallel
    const [clientRes, assetsRes, ordersRes] = await Promise.all([
        supabase
            .from('tenant_clients')
            .select('*')
            .eq('id', id)  // Usar 'id' en lugar de 'params.id'
            .eq('tenant_id', auth.tenantId)
            .single(),


        supabase
            .from('tenant_assets')
            .select('id, name, asset_type, model, serial, created_at')
            .eq('client_id', id)  // Usar 'id' en lugar de 'params.id'
            .eq('tenant_id', auth.tenantId)
            .order('name', { ascending: true }),


        supabase
            .from('tenant_work_orders')
            .select('id, title, status, created_at, total_amount')
            .eq('client_id', id)  // Usar 'id' en lugar de 'params.id'
            .eq('tenant_id', auth.tenantId)
            .order('created_at', { ascending: false })
    ])


    const client = clientRes.data
    const assets = assetsRes.data || []
    const orders = ordersRes.data || []


    if (clientRes.error || !client) {
        if (clientRes.error) console.error('Error loading client:', clientRes.error)
        notFound()
    }


    const canEdit = ['Admin', 'Operador'].includes(auth.roleKey)
    const canDelete = auth.roleKey === 'Admin'


    return (
        <ClientDetailView
            client={client}
            assets={assets}
            workOrders={orders}
            canEdit={canEdit}
            canDelete={canDelete}
        />
    )
}

