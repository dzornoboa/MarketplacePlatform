import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { hasAdminMfaAccess, hasCapability, isAdminRole, isStaffRole, marketplaceLock, type AccessState, type StaffCapability } from '@/lib/auth/access'

/* Authenticated session + profile, with no access gates applied. Use this only
   for the pages that must stay reachable while an account is blocked or is
   still waiting for its first password. */
type Profile = Database['public']['Tables']['profiles']['Row']
type Bootstrap = { profile: Profile; access: AccessState | null; unread: number }

/* One round trip: session_bootstrap() returns the profile, the access state
   and the unread-notification count together, so layouts and pages never
   repeat those queries. */
const loadSession = cache(async () => {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (claimsError || !claims?.sub) return { supabase, claims: null, profile: null, access: null, unread: 0 }
  const { data } = await supabase.rpc('session_bootstrap')
  const boot = (data ?? null) as Bootstrap | null
  return { supabase, claims, profile: boot?.profile ?? null, access: boot?.access ?? null, unread: boot?.unread ?? 0 }
})

/* Memoised per request (React cache), so the layout and the page share one
   claims check and one profile fetch instead of repeating both. */
export async function requireSession() {
  const { supabase, claims, profile, unread } = await loadSession()
  if (!claims?.sub) redirect('/login')
  if (!profile) redirect('/login?error=profile-unavailable')
  return { supabase, claims, profile, unread }
}

/* The standard dashboard guard. A suspended or disabled account keeps its
   session but is held on /account-status; an admin-provisioned account must
   set its own password before anything else. */
export async function requireUserProfile() {
  const context = await requireSession()
  if (context.profile.account_status === 'suspended' || context.profile.account_status === 'disabled') redirect('/account-status')
  if (context.profile.password_change_required) redirect('/set-password')
  return context
}

/* Active + not view-blocked + holding a paid subscription. Mirrors
   private.has_marketplace_access(); the database is still the enforcement
   point, this just avoids rendering a page the RLS would empty out. */
export async function requireMarketplaceAccess() {
  const context = await requireUserProfile()
  const state = await readAccessState(context.supabase)
  if (!state) redirect('/dashboard/opportunities?locked=1')
  const lock = marketplaceLock(state)
  // An unpaid plan sends the member straight to the payment step.
  if (lock.locked) redirect(state.subscription_status === 'pending' ? '/dashboard/billing?message=' + encodeURIComponent('Pay for your plan to activate your account and open the marketplace.') + '#pay' : '/dashboard/opportunities?locked=1')
  return { ...context, accessState: state }
}

export async function requireAdminProfile() {
  const context = await requireUserProfile()
  if (!isAdminRole(context.profile.system_role)) redirect('/dashboard')
  const aal = typeof context.claims.aal === 'string' ? context.claims.aal : null
  if (!hasAdminMfaAccess(context.profile.system_role, aal)) redirect('/dashboard/security?required=admin-mfa')
  return context
}

/* Staff console guard. Administrators hold every capability but must clear MFA
   first, matching private.staff_has_capability(). */
export async function requireCapability(capability: StaffCapability) {
  const context = await requireUserProfile()
  const role = context.profile.system_role
  if (!isStaffRole(role) || !hasCapability(role, capability)) redirect('/dashboard')
  if (isAdminRole(role)) {
    const aal = typeof context.claims.aal === 'string' ? context.claims.aal : null
    if (!hasAdminMfaAccess(role, aal)) redirect('/dashboard/security?required=admin-mfa')
  }
  return context
}

type SupabaseLike = Awaited<ReturnType<typeof createClient>>

const loadAccessState = cache(async (supabase: SupabaseLike) => {
  // Already fetched by the session bootstrap for the current request.
  const session = await loadSession()
  if (session.access) return session.access
  const { data, error } = await supabase.rpc('my_access_state')
  if (error || !data) return null
  return data as unknown as AccessState
})

export async function readAccessState(supabase: SupabaseLike): Promise<AccessState | null> {
  return loadAccessState(supabase)
}

export async function getAccessState() {
  const supabase = await createClient()
  return readAccessState(supabase)
}

/* The staff console shell. Any staff role may enter; each page then enforces
   its own capability, so a trade officer sees the opportunity queue and a
   finance officer sees subscriptions without either needing full admin. */
export async function requireStaffConsole() {
  const context = await requireUserProfile()
  const role = context.profile.system_role
  if (!isStaffRole(role)) redirect('/dashboard')
  if (isAdminRole(role)) {
    const aal = typeof context.claims.aal === 'string' ? context.claims.aal : null
    if (!hasAdminMfaAccess(role, aal)) redirect('/dashboard/security?required=admin-mfa')
  }
  return context
}

/* Super administrator only. The database agrees: the profile-protection trigger
   gives an unconditional pass to super_admin and refuses staff-role changes
   from anyone else. */
export async function requireSuperAdmin() {
  const context = await requireUserProfile()
  if (context.profile.system_role !== 'super_admin') redirect('/admin')
  const aal = typeof context.claims.aal === 'string' ? context.claims.aal : null
  if (!hasAdminMfaAccess(context.profile.system_role, aal)) redirect('/dashboard/security?required=admin-mfa')
  return context
}
