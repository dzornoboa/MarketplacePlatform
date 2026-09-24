'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/redirects'
import { validateEmail, validatePassword, validateSignupInput } from '@/lib/auth/validation'
import { getSiteUrl } from '@/lib/supabase/config'
import { allow } from '@/lib/security/throttle'
import { checkEmailAddress } from '@/lib/email/verify-address'

function withMessage(path: string, key: 'error' | 'message', message: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${key}=${encodeURIComponent(message)}`
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(String(formData.get('next') ?? '/dashboard'))
  if (validateEmail(email) || !password) redirect(withMessage('/login', 'error', 'Enter a valid email address and password.'))
  // 10 attempts per 15 minutes per address+IP, 60 per IP: slows credential stuffing without locking real users out.
  if (!(await allow('login', 10, 900, email)) || !(await allow('login_ip', 60, 900))) redirect(withMessage('/login', 'error', 'Too many sign-in attempts. Wait 15 minutes and try again.'))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(withMessage('/login', 'error', 'Invalid email or password.'))
  revalidatePath('/', 'layout')

  /* An account with an enrolled authenticator is only at aal1 after the
     password step. Send it straight to the code prompt rather than to a
     dashboard that will report the console as locked. */
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assurance?.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
    redirect(`/dashboard/security?required=admin-mfa&next=${encodeURIComponent(next)}`)
  }
  redirect(next)
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const participantType = String(formData.get('participantType') ?? '')
  const validation = validateSignupInput({ fullName, email, password, participantType })
  if (!validation.ok) redirect(withMessage('/register', 'error', Object.values(validation.errors)[0] ?? 'Check your registration details.'))
  if (!(await allow('signup', 5, 3600))) redirect(withMessage('/register', 'error', 'Too many registrations from this connection. Try again later.'))
  // The address must be deliverable before an account exists for it.
  const address = await checkEmailAddress(email)
  if (!address.ok) redirect(withMessage('/register', 'error', address.reason))
  const supabase = await createClient()
  const COMPANY_TYPES = new Set(['business', 'wtc_association_member', 'wtc_accra_member'])
  const organisationName = String(formData.get('organisationName') ?? '').trim()
  if (COMPANY_TYPES.has(participantType) && organisationName.length < 2) redirect(withMessage('/register', 'error', 'Enter your organisation name.'))
  const WTC_TYPES = new Set(['wtc_accra_member', 'wtc_association_member'])
  if (WTC_TYPES.has(participantType) && !email.toLowerCase().endsWith('@wtcaccra.com')) redirect(withMessage('/register', 'error', 'WTC Accra and WTC Association member accounts must register with an @wtcaccra.com email address.'))
  const extra = {
    organisation_name: organisationName || null,
    wtca_membership_number: String(formData.get('wtcaMembershipNumber') ?? '').trim() || null,
    wtca_chapter: String(formData.get('wtcaChapter') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    country: String(formData.get('country') ?? '').trim() || null,
    plan_code: String(formData.get('planCode') ?? '').trim() || null,
  }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, participant_type: participantType, ...extra }, emailRedirectTo: `${getSiteUrl()}/auth/confirm` } })
  if (error) redirect(withMessage('/register', 'error', error.message))
  if (data.session) { revalidatePath('/', 'layout'); redirect('/dashboard') }
  /* Email confirmation is on: the account cannot sign in until the code
     (or link) from the confirmation email is used. */
  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
}

/* Six-digit code from the confirmation email. Verifying it confirms the
   address and signs the member in; the link in the same email also works. */
export async function verifyEmailCode(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const token = String(formData.get('code') ?? '').replace(/\D/g, '')
  const back = `/verify-email?email=${encodeURIComponent(email)}`
  if (validateEmail(email)) redirect(withMessage('/register', 'error', 'Start again with a valid email address.'))
  if (token.length < 6) redirect(withMessage(back, 'error', 'Enter the 6-digit code from the email.'))
  if (!(await allow('verify_code', 8, 900, email))) redirect(withMessage(back, 'error', 'Too many attempts. Request a new code in 15 minutes.'))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
  if (error || !data.session) redirect(withMessage(back, 'error', 'That code is not valid or has expired. Request a new one below.'))
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function resendVerificationCode(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const back = `/verify-email?email=${encodeURIComponent(email)}`
  if (validateEmail(email)) redirect('/register')
  if (!(await allow('resend_code', 3, 600, email))) redirect(withMessage(back, 'error', 'Please wait before requesting another code.'))
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${getSiteUrl()}/auth/confirm` } })
  if (error) redirect(withMessage(back, 'error', /rate|seconds/i.test(error.message) ? 'Please wait a minute before requesting another code.' : 'Could not send a new code. Try again shortly.'))
  redirect(withMessage(back, 'message', 'A new code has been sent.'))
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (validateEmail(email)) redirect(withMessage('/forgot-password', 'error', 'Enter a valid email address.'))
  if (!(await allow('password_reset', 3, 900, email))) redirect(withMessage('/login', 'message', 'If the account exists, a password reset email has been sent.'))
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${getSiteUrl()}/auth/confirm?next=/reset-password` })
  if (error) redirect(withMessage('/forgot-password', 'error', 'Unable to send the reset email. Try again.'))
  redirect(withMessage('/login', 'message', 'If the account exists, a password reset email has been sent.'))
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const passwordError = validatePassword(password)
  if (passwordError) redirect(withMessage('/reset-password', 'error', passwordError))
  if (password !== confirmPassword) redirect(withMessage('/reset-password', 'error', 'Passwords do not match.'))
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims) redirect('/login')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(withMessage('/reset-password', 'error', 'Unable to update the password.'))
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(withMessage('/login', 'message', 'Password updated. Sign in with your new password.'))
}

/* First-time password for an account WTC Accra provisioned. The profile stays
   flagged `password_change_required` until the member sets their own password,
   and every dashboard guard holds them here until they do. */
export async function setInitialPassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const passwordError = validatePassword(password)
  if (passwordError) redirect(withMessage('/set-password', 'error', passwordError))
  if (password !== confirmPassword) redirect(withMessage('/set-password', 'error', 'Passwords do not match.'))
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(withMessage('/set-password', 'error', 'Unable to set the password. Try again.'))
  const { error: clearError } = await supabase.rpc('complete_initial_password_change', { target_user: String(userId) })
  if (clearError) redirect(withMessage('/set-password', 'error', 'Password saved, but the account could not be activated. Contact support.'))
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
