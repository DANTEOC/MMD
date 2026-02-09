import { requireAuth } from '@/lib/auth/guards'

export default async function DebugAuthPage() {
    const ctx = await requireAuth()
    return <pre>{JSON.stringify(ctx, null, 2)}</pre>
}
