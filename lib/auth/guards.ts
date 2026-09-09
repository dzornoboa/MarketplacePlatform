import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasAdminMfaAccess, isAdminRole } from '@/lib/auth/access'

export async function requireUserProfile() {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (claimsError || !claims?.sub) redirect('/login')
  const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', claims.sub).single()
  if (profileError || !profile) redirect('/login?error=profile-unavailable')
  return { supabase, claims, profile }
}

export async function requireVerifiedProfile() {
  const context = await requireUserProfile()
  if (context.profile.verification_status !== 'verified') redirect('/dashboard?locked=verification')
  return context
}

export async function requireAdminProfile() {
  const context = await requireUserProfile()
  if (!isAdminRole(context.profile.system_role)) redirect('/dashboard')
  const aal = typeof context.claims.aal === 'string' ? context.claims.aal : null
  if (!hasAdminMfaAccess(context.profile.system_role, aal)) redirect('/dashboard/security?required=admin-mfa')
  return context
}
