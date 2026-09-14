import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { FlashNotice } from '@/components/flash-notice'
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
  const { supabase, profile, claims, unread } = await requireUserProfile()
  const adminRole = isAdminRole(profile.system_role)
  const adminMfaReady = !adminRole || claims.aal === 'aal2'
  const { data: factors } = adminRole && !adminMfaReady ? await supabase.auth.mfa.listFactors() : { data: null }
  const adminHasFactor = (factors?.totp ?? []).some(f => f.status === 'verified')
  // Profile, access state and unread count all come from the one bootstrap call; a daily cron expires lapsed subscriptions.
  const state = await readAccessState(supabase)
  const count = unread
  const daysLeft = state ? subscriptionDaysLeft(state) : null
  const planLabel = state?.subscription_plan
    ? `${state.subscription_plan.replaceAll('_', ' ')} · active`
    : state?.subscription_status === 'pending' ? 'Plan chosen · payment due'
    : state?.subscription_status === 'awaiting_approval' ? 'Plan paid · awaiting approval'
    : state?.subscription_status === 'expired' ? 'Plan expired' : null
  const memberOnly = profile.system_role === 'user'
  const expiryNotice = memberOnly && state?.subscription_status === 'expired'
    ? { tone: 'error', text: 'Your subscription has expired. Marketplace access is paused until you renew.', cta: 'Renew now' }
    : memberOnly && state?.has_active_subscription && daysLeft !== null && daysLeft <= 30
      ? { tone: 'warn', text: `Your subscription ends ${state.subscription_ends_at ? date(state.subscription_ends_at) : 'soon'} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left). Renew to keep access.`, cta: 'Renew' }
      : null

  return <div className="dashboard-shell">
    <DashboardNav profile={profile} unreadCount={count ?? 0} adminMfaReady={adminMfaReady} adminHasFactor={adminHasFactor} hasAccess={!!state && !marketplaceLock(state).locked} planLabel={planLabel} />
    <main className="dashboard-main">
      {expiryNotice && <div className={`expiry-bar expiry-bar-${expiryNotice.tone}`}><span>{expiryNotice.text}</span><Link className="button button-light" href="/dashboard/billing">{expiryNotice.cta}</Link></div>}
      {children}
    </main>
    <RealtimeAccess userId={profile.id} />
    <Suspense fallback={null}><FlashNotice /></Suspense>
  </div>
}
