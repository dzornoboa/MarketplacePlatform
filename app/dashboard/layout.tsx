import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { subscriptionDaysLeft } from '@/lib/auth/access'
import { marketplaceLock } from '@/lib/auth/access'
import { date } from '@/lib/format'
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
  // Lapsed subscriptions are expired lazily on each dashboard visit (no cron on this project).
  const [{ count }, state] = await Promise.all([
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).is('read_at', null),
    supabase.rpc('expire_subscriptions').then(() => readAccessState(supabase)),
  ])
  const daysLeft = state ? subscriptionDaysLeft(state) : null
  const memberOnly = profile.system_role === 'user'
  const expiryNotice = memberOnly && state?.subscription_status === 'expired'
    ? { tone: 'error', text: 'Your subscription has expired. Marketplace access is paused until you renew.', cta: 'Renew now' }
    : memberOnly && state?.has_active_subscription && daysLeft !== null && daysLeft <= 30
      ? { tone: 'warn', text: `Your subscription ends ${state.subscription_ends_at ? date(state.subscription_ends_at) : 'soon'} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left). Renew to keep access.`, cta: 'Renew' }
      : null

  return <div className="dashboard-shell">
    <DashboardNav profile={profile} unreadCount={count ?? 0} adminMfaReady={adminMfaReady} adminHasFactor={adminHasFactor} hasAccess={!!state && !marketplaceLock(state).locked} />
    <main className="dashboard-main">
      {expiryNotice && <div className={`expiry-bar expiry-bar-${expiryNotice.tone}`}><span>{expiryNotice.text}</span><Link className="button button-light" href="/dashboard/billing">{expiryNotice.cta}</Link></div>}
      {children}
    </main>
    <RealtimeAccess userId={profile.id} />
  </div>
}
