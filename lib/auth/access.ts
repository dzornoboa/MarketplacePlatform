export const participantTypes = [
  'investor',
  'buyer',
  'business',
  'project_sponsor',
  'wtc_association_member',
  'wtc_accra_member',
  'staff',
  'institutional_partner',
] as const

export type ParticipantType = (typeof participantTypes)[number]

/* Participant types a member may choose at registration. `staff` is assigned by
   WTC Accra only; `institutional_partner` is granted after review. */
export const selectableParticipantTypes = [
  'investor',
  'buyer',
  'business',
  'project_sponsor',
  'wtc_association_member',
  'wtc_accra_member',
] as const

export const participantTypeLabels: Record<ParticipantType, string> = {
  investor: 'Investor',
  buyer: 'Buyer',
  business: 'Business',
  project_sponsor: 'Project sponsor',
  wtc_association_member: 'WTC Association member',
  wtc_accra_member: 'WTC Accra member',
  staff: 'WTC Accra staff',
  institutional_partner: 'Institutional partner',
}

export const systemRoles = [
  'user',
  'trade_officer',
  'verification_officer',
  'content_manager',
  'finance',
  'admin',
  'super_admin',
  'support',
] as const

export type SystemRole = (typeof systemRoles)[number]

export const systemRoleLabels: Record<SystemRole, string> = {
  user: 'Member',
  trade_officer: 'Trade officer',
  verification_officer: 'Verification officer',
  content_manager: 'Content manager',
  finance: 'Finance',
  admin: 'Administrator',
  super_admin: 'Super administrator',
  support: 'Support',
}

export const verificationStatuses = [
  'pending_profile',
  'pending_review',
  'verified',
  'changes_requested',
  'rejected',
  'suspended',
] as const

export type VerificationStatus = (typeof verificationStatuses)[number]

export const accountStatuses = ['pending', 'active', 'suspended', 'disabled'] as const
export type AccountStatus = (typeof accountStatuses)[number]

/* Mirrors private.staff_has_capability() in the database. The database is the
   enforcement point; this exists so the UI hides what the user cannot do. */
export const staffCapabilities = [
  'verification',
  'opportunities',
  'matching',
  'introductions',
  'finance',
  'content',
  'support',
  'reports',
  'users',
] as const

export type StaffCapability = (typeof staffCapabilities)[number]

const roleCapabilities: Record<SystemRole, readonly StaffCapability[]> = {
  user: [],
  trade_officer: ['opportunities', 'matching', 'introductions', 'reports'],
  verification_officer: ['verification', 'users'],
  content_manager: ['content'],
  finance: ['finance', 'reports'],
  support: ['support'],
  admin: staffCapabilities,
  super_admin: staffCapabilities,
}

const adminRoles = new Set<SystemRole>(['admin', 'super_admin'])
const staffRoles = new Set<SystemRole>(['trade_officer', 'verification_officer', 'content_manager', 'finance', 'admin', 'super_admin', 'support'])
const participantTypeSet = new Set<string>(participantTypes)
const selectableParticipantTypeSet = new Set<string>(selectableParticipantTypes)

export function isAdminRole(role: string | null | undefined): role is 'admin' | 'super_admin' {
  return !!role && adminRoles.has(role as SystemRole)
}

export function isStaffRole(role: string | null | undefined): role is Exclude<SystemRole, 'user'> {
  return !!role && staffRoles.has(role as SystemRole)
}

export function hasCapability(role: string | null | undefined, capability: StaffCapability): boolean {
  if (!role || !(role in roleCapabilities)) return false
  return roleCapabilities[role as SystemRole].includes(capability)
}

export function canUseVerifiedFeatures(status: string | null | undefined): boolean {
  return status === 'verified'
}

export function isKnownParticipantType(value: string | null | undefined): value is ParticipantType {
  return !!value && participantTypeSet.has(value)
}

export function isSelectableParticipantType(value: string | null | undefined): value is ParticipantType {
  return !!value && selectableParticipantTypeSet.has(value)
}

export function labelForParticipantType(value: string | null | undefined): string {
  return isKnownParticipantType(value) ? participantTypeLabels[value] : 'Not selected'
}

export function humanize(value: string | null | undefined, fallback = '—'): string {
  return value ? value.replaceAll('_', ' ') : fallback
}

/* Verification is the WTC Accra check mark, not an access gate: a paid
   subscription opens the platform; the check tells other members the
   account was reviewed by an administrator. */
export function dashboardRestrictionReason(status: VerificationStatus): string | null {
  switch (status) {
    case 'verified': return null
    case 'pending_profile': return 'Complete your profile and submit your documents to earn the WTC Accra verified check.'
    case 'pending_review': return 'Your verification is under review by WTC Accra. The verified check appears on your profile once approved.'
    case 'changes_requested': return 'WTC Accra requested changes to your verification. Update your profile and resubmit.'
    case 'rejected': return 'Your verification was not approved. Contact WTC Accra support if you believe this needs review.'
    case 'suspended': return 'Your account is suspended. Contact WTC Accra support for assistance.'
  }
}

export function hasVerifiedCheck(status: string | null | undefined): boolean {
  return status === 'verified'
}

/* Why the marketplace is locked, in the order the member must resolve it.
   Mirrors private.has_marketplace_access() in the database. */
export type AccessState = {
  verification_status: VerificationStatus
  account_status: AccountStatus
  participant_type: string | null
  can_view_opportunities: boolean
  can_post_opportunities: boolean
  has_active_subscription: boolean
  has_paid_plan?: boolean
  subscription_ends_at: string | null
  subscription_plan?: string | null
  subscription_status?: string | null
  support_bypass_until?: string | null
}

/* Days until the active subscription ends; negative when expired. */
export function subscriptionDaysLeft(state: AccessState): number | null {
  if (!state.subscription_ends_at) return null
  return Math.ceil((new Date(state.subscription_ends_at).getTime() - Date.now()) / 86400000)
}

export type MarketplaceLock =
  | { locked: true; reason: string; action: { label: string; href: string } | null }
  | { locked: false }

export function marketplaceLock(state: AccessState): MarketplaceLock {
  if (state.account_status === 'suspended' || state.account_status === 'disabled') {
    return { locked: true, reason: 'Your account is not active. Contact WTC Accra support.', action: { label: 'Contact support', href: '/dashboard/support' } }
  }
  if (!state.can_view_opportunities) {
    return { locked: true, reason: 'WTC Accra has paused marketplace browsing on your account.', action: { label: 'Contact support', href: '/dashboard/support' } }
  }
  if (!state.has_active_subscription) {
    if (state.subscription_status === 'expired') return { locked: true, reason: 'Your subscription has expired. Marketplace access is paused until you renew.', action: { label: 'Renew now', href: '/dashboard/billing' } }
    if (state.subscription_status === 'awaiting_approval') return { locked: true, reason: 'Your plan is paid and awaiting WTC Accra approval.', action: { label: 'View billing', href: '/dashboard/billing' } }
    if (state.subscription_status === 'pending') return { locked: true, reason: 'Complete the payment for your chosen plan to open the marketplace.', action: { label: 'Pay now', href: '/dashboard/billing#pay' } }
    return { locked: true, reason: 'Opportunities are available to members with an active subscription.', action: { label: 'View plans', href: '/dashboard/billing' } }
  }
  return { locked: false }
}

export function postingLock(state: AccessState): MarketplaceLock {
  if (state.account_status !== 'active') {
    return { locked: true, reason: 'Your account is not active.', action: { label: 'Contact support', href: '/dashboard/support' } }
  }
  if (!state.can_post_opportunities) {
    return { locked: true, reason: 'WTC Accra has paused opportunity posting on your account.', action: { label: 'Contact support', href: '/dashboard/support' } }
  }
  if (!state.has_active_subscription) {
    return { locked: true, reason: state.subscription_status === 'pending' ? 'Pay for your plan to activate your account before posting.' : 'An active plan is needed before posting.', action: { label: 'Go to billing', href: '/dashboard/billing#pay' } }
  }
  if (state.has_paid_plan === false) {
    return { locked: true, reason: 'Your free plan lets you browse. Upgrade to a paid plan to post listings.', action: { label: 'Upgrade plan', href: '/dashboard/billing' } }
  }
  return { locked: false }
}

export function hasAdminMfaAccess(role: string | null | undefined, aal: string | null | undefined): boolean {
  return isAdminRole(role) && aal === 'aal2'
}

/* How a listing is positioned. "Posting as an investor" and "seeking investment
   for a project" are the two sides members most often mean. */
export const listingIntents = [
  'seeking_investment',
  'offering_investment',
  'offering_supply',
  'seeking_supply',
  'partnership',
] as const

export type ListingIntent = (typeof listingIntents)[number]

export const listingIntentLabels: Record<ListingIntent, string> = {
  seeking_investment: 'Seeking investment',
  offering_investment: 'Investor — capital available',
  offering_supply: 'Offering goods or services',
  seeking_supply: 'Sourcing goods or services',
  partnership: 'Seeking a partner',
}

export const listingIntentHelp: Record<ListingIntent, string> = {
  seeking_investment: 'You have a project or business and are looking for capital.',
  offering_investment: 'You are an investor and want qualified counterparties to approach you.',
  offering_supply: 'You supply goods or services and want buyers to find you.',
  seeking_supply: 'You are sourcing and want suppliers to approach you.',
  partnership: 'You are looking for a joint venture, distribution or strategic partner.',
}

export function labelForIntent(value: string | null | undefined): string {
  return value && value in listingIntentLabels ? listingIntentLabels[value as ListingIntent] : 'Listing'
}

/* WTC Accra staff work inside the marketplace to review and post on behalf of
   the organisation, so they are not held behind the member subscription gate.
   The database says the same thing: the opportunities SELECT policy ORs
   private.is_staff(), and can_post_opportunities() now accepts the
   opportunities capability. */
export function marketplaceLockFor(state: AccessState, role: string | null | undefined): MarketplaceLock {
  if (isStaffRole(role) && state.account_status === 'active') return { locked: false }
  return marketplaceLock(state)
}

export function postingLockFor(state: AccessState, role: string | null | undefined): MarketplaceLock {
  if (isStaffRole(role) && state.account_status === 'active') return { locked: false }
  return postingLock(state)
}
