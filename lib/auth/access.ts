export const participantTypes = [
  'investor',
  'buyer',
  'business',
  'project_sponsor',
  'wtc_association_member',
  'wtc_accra_member',
  'staff',
] as const

export type ParticipantType = (typeof participantTypes)[number]

export const systemRoles = [
  'user',
  'trade_officer',
  'verification_officer',
  'content_manager',
  'finance',
  'admin',
  'super_admin',
] as const

export type SystemRole = (typeof systemRoles)[number]

export const verificationStatuses = [
  'pending_profile',
  'pending_review',
  'verified',
  'changes_requested',
  'rejected',
  'suspended',
] as const

export type VerificationStatus = (typeof verificationStatuses)[number]

const adminRoles = new Set<SystemRole>(['admin', 'super_admin'])
const staffRoles = new Set<SystemRole>(['trade_officer','verification_officer','content_manager','finance','admin','super_admin'])
const participantTypeSet = new Set<string>(participantTypes)

export function isAdminRole(role: string | null | undefined): role is 'admin' | 'super_admin' {
  return !!role && adminRoles.has(role as SystemRole)
}

export function isStaffRole(role: string | null | undefined): role is Exclude<SystemRole, 'user'> {
  return !!role && staffRoles.has(role as SystemRole)
}

export function canUseVerifiedFeatures(status: string | null | undefined): boolean {
  return status === 'verified'
}

export function isKnownParticipantType(value: string | null | undefined): value is ParticipantType {
  return !!value && participantTypeSet.has(value)
}

export function dashboardRestrictionReason(status: VerificationStatus): string | null {
  switch (status) {
    case 'verified': return null
    case 'pending_profile': return 'Complete your profile and submit it for verification to unlock opportunities.'
    case 'pending_review': return 'Your verification is under review by WTC Accra. Opportunities remain locked until approval.'
    case 'changes_requested': return 'WTC Accra requested changes to your verification. Update your profile and resubmit.'
    case 'rejected': return 'Your verification was rejected. Contact WTC Accra support if you believe this needs review.'
    case 'suspended': return 'Your account is suspended. Contact WTC Accra support for assistance.'
  }
}

export function hasAdminMfaAccess(role: string | null | undefined, aal: string | null | undefined): boolean {
  return isAdminRole(role) && aal === 'aal2'
}
