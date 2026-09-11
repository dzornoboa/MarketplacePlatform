import type { ReactNode } from 'react'
import { requireUserProfile } from '@/lib/auth/guards'
import { DashboardNav } from '@/components/dashboard-nav'
import { RealtimeAccess } from '@/components/realtime-access'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, profile } = await requireUserProfile()
  const { count } = await supabase.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id).is('read_at', null)

  return <div className="dashboard-shell">
    <DashboardNav profile={profile} unreadCount={count ?? 0} />
    <main className="dashboard-main">{children}</main>
    <RealtimeAccess userId={profile.id} />
  </div>
}
