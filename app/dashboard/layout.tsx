import type { ReactNode } from 'react'
import { requireUserProfile } from '@/lib/auth/guards'
import { DashboardNav } from '@/components/dashboard-nav'
import { isAdminRole } from '@/lib/auth/access'
import { RealtimeAccess } from '@/components/realtime-access'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, profile, claims } = await requireUserProfile()
  const adminRole = isAdminRole(profile.system_role)
  const adminMfaReady = !adminRole || claims.aal === 'aal2'
  const { data: factors } = adminRole && !adminMfaReady ? await supabase.auth.mfa.listFactors() : { data: null }
  const adminHasFactor = (factors?.totp ?? []).some(f => f.status === 'verified')
  const { count } = await supabase.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id).is('read_at', null)

  return <div className="dashboard-shell">
    <DashboardNav profile={profile} unreadCount={count ?? 0} adminMfaReady={adminMfaReady} adminHasFactor={adminHasFactor} />
    <main className="dashboard-main">{children}</main>
    <RealtimeAccess userId={profile.id} />
  </div>
}
