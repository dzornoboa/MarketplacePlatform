'use server'

import { after } from 'next/server'
import { registrationEmailFetch } from '@/lib/auth/registration-email'
import { cookies } from 'next/headers'
import { hasPasswordRecoveryGrant, recoveryCookie } from '@/lib/auth/password-recovery'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/redirects'
import { validateEmail, validatePassword, validateSignupInput } from '@/lib/auth/validation'
import { getSiteUrl } from '@/lib/supabase/config'
import { allow, checkAllowed, resetLimit } from '@/lib/security/throttle'
import { checkEmailAddress } from '@/lib/email/verify-address'
import { clearRegistrationFollowup, trackRegistrationFailure } from '@/lib/auth/registration-followups'
import { createAdminClient } from '@/lib/supabase/admin'

function withMessage(path: string, key: 'error' | 'message', message: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${key}=${encodeURIComponent(message)}`
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(String(formData.get('next') ?? '/dashboard'))
  const retryPath = `/login?${new URLSearchParams({ next })}`
  if (validateEmail(email) || !password) redirect(withMessage(retryPath, 'error', 'Enter a valid email address and password.'))
  // Only failed password attempts consume the limiter. The old implementation
  // counted every sign-in, including successful ones, which could lock legitimate
  // members out. A limiter infrastructure fault now falls back to Supabase Auth
  // instead of being presented as a false "too many attempts" error.
  const [accountAllowed, ipAllowed] = await Promise.all([
    checkAllowed('login', 10, 900, email),
    checkAllowed('login_ip', 120, 900),
  ])
  if (accountAllowed === false || ipAllowed === false) {
    redirect(withMessage(retryPath, 'error', 'Too many failed sign-in attempts. Wait 15 minutes and try again, or reset your password.'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    await Promise.allSettled([
      allow('login', 10, 900, email),
      allow('login_ip', 120, 900),
    ])
    redirect(withMessage(retryPath, 'error', 'Invalid email or password.'))
  }

  await Promise.allSettled([resetLimit('login', email), resetLimit('login_ip')])
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
  const dateOfBirth = String(formData.get('dateOfBirth') ?? '').trim()
  const idType = String(formData.get('idType') ?? '').trim()
  const idNumber = String(formData.get('idNumber') ?? '').trim()
  const allowedIdTypes = new Set(['passport', 'drivers_license', 'voter_id', 'residence_permit', 'national_id', 'other'])
  const birthDate = dateOfBirth ? new Date(`${dateOfBirth}T00:00:00Z`) : null
  const today = new Date()
  const ageCutoff = new Date(Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()))
  const oldestReasonable = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()))
  if (!birthDate || Number.isNaN(birthDate.getTime()) || birthDate > ageCutoff) redirect(withMessage('/register', 'error', 'You must be at least 18 years old to create an account.'))
  if (birthDate < oldestReasonable) redirect(withMessage('/register', 'error', 'Enter a valid date of birth.'))
  if (!allowedIdTypes.has(idType)) redirect(withMessage('/register', 'error', 'Select a valid identification type.'))
  if (idNumber.length < 3 || idNumber.length > 80) redirect(withMessage('/register', 'error', 'Enter a valid identification number.'))
  const legalAgreementAccepted = String(formData.get('legalAgreementAccepted') ?? '') === 'yes'
  const legalAgreementVersion = String(formData.get('legalAgreementVersion') ?? '').trim()
  if (!legalAgreementAccepted || legalAgreementVersion !== '2026-09-29-v2') redirect(withMessage('/register', 'error', 'Read and accept the NDA, Terms and User Agreement before registration.'))
  const username = String(formData.get('username') ?? '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) redirect(withMessage('/register', 'error', 'Choose a valid username using lowercase letters, numbers, dots, hyphens or underscores.'))
  const validation = validateSignupInput({ fullName, email, password, participantType })
  if (!validation.ok) redirect(withMessage('/register', 'error', Object.values(validation.errors)[0] ?? 'Check your registration details.'))
  const COMPANY_TYPES = new Set(['business', 'wtc_association_member', 'wtc_accra_member'])
  const organisationName = String(formData.get('organisationName') ?? '').trim()
  if (COMPANY_TYPES.has(participantType) && organisationName.length < 2) redirect(withMessage('/register', 'error', 'Enter your organisation name.'))
  const membershipAccessId = String(formData.get('membershipAccessId') ?? formData.get('wtcAccraMembershipId') ?? '').trim().toUpperCase()
  const country = String(formData.get('country') ?? '').trim()
  const countryCode = String(formData.get('countryCode') ?? '').trim().toUpperCase()
  const phoneCountryCode = String(formData.get('phoneCountryCode') ?? '').trim()
  const phoneLocal = String(formData.get('phoneLocal') ?? '').replace(/\D/g, '')
  const preferredCurrency = String(formData.get('preferredCurrency') ?? 'USD').trim().toUpperCase()
  if (!country || !/^[A-Z]{2}$/.test(countryCode)) redirect(withMessage('/register', 'error', 'Select a valid country.'))
  if (!/^\+[0-9]{1,4}$/.test(phoneCountryCode) || phoneLocal.length < 5 || phoneLocal.length > 15) redirect(withMessage('/register', 'error', 'Enter a valid telephone number for your selected country.'))
  if (!/^[A-Z]{3}$/.test(preferredCurrency)) redirect(withMessage('/register', 'error', 'Select a valid preferred currency.'))
  const nationalNumber = phoneLocal.replace(/^0+/, '')
  const phone = `${phoneCountryCode}${nationalNumber}`
  const language = String(formData.get('language') ?? 'en').trim().toLowerCase()
  const locale = String(formData.get('locale') ?? 'en').trim()
  const timezone = String(formData.get('timezone') ?? 'UTC').trim()
  const investmentBand = String(formData.get('investmentBand') ?? '')
  if (!['up-to-5m', '5m-to-10m', '10m-to-50m', 'above-50m'].includes(investmentBand)) redirect(withMessage('/register', 'error', 'Select your intended investment size category.'))
  if (!(await allow('signup', 5, 3600))) redirect(withMessage('/register', 'error', 'Too many registrations from this connection. Try again later.'))
  if (participantType === 'wtc_accra_member' || participantType === 'wtc_association_member') {
    const expectedPattern = participantType === 'wtc_accra_member' ? /^WTCA[0-9]{10}$/ : /^WTCAM[0-9]{10}$/
    const label = participantType === 'wtc_accra_member' ? 'WTC Accra Membership ID' : 'WTCA Member ID'
    if (!expectedPattern.test(membershipAccessId)) {
      redirect(withMessage('/register', 'error', `Enter a valid ${label} issued and activated by WTC Accra. Membership access IDs are provided through wtcaccra.com.`))
    }

    let membershipState = ''
    try {
      const admin = createAdminClient()
      const { data, error: membershipIdError } = await admin.rpc('membership_id_signup_state', {
        membership_code: membershipAccessId,
        member_email: email,
        participant: participantType,
      })
      if (membershipIdError) throw membershipIdError
      membershipState = typeof data === 'object' && data ? String((data as { state?: unknown }).state ?? '') : ''
    } catch {
      redirect(withMessage('/register', 'error', 'Membership ID validation is temporarily unavailable. Please try again shortly.'))
    }
    if (membershipState === 'linked_account') {
      redirect(withMessage('/login', 'message', 'This Membership ID is already linked to an account. Sign in instead.'))
    }
    if (membershipState !== 'valid') {
      redirect(withMessage('/register', 'error', `That ${label} is not valid for this email or has not been activated. Enter the ID issued to you by WTC Accra through wtcaccra.com.`))
    }
  }
  const address = await checkEmailAddress(email)
  if (!address.ok) redirect(withMessage('/register', 'error', address.reason))
  const supabase = await createClient(registrationEmailFetch)
  const extra = {
    investment_band: investmentBand,
    organisation_name: organisationName || null,
    wtca_membership_number: String(formData.get('wtcaMembershipNumber') ?? '').trim() || null,
    membership_access_id: membershipAccessId || null,
    wtc_accra_membership_id: participantType === 'wtc_accra_member' ? membershipAccessId || null : null,
    wtca_chapter: String(formData.get('wtcaChapter') ?? '').trim() || null,
    phone,
    country,
    country_code: countryCode,
    phone_country_code: phoneCountryCode,
    preferred_currency: preferredCurrency,
    language,
    locale,
    timezone,
    username,
    plan_code: String(formData.get('planCode') ?? '').trim() || null,
    date_of_birth: dateOfBirth,
    id_type: idType,
    id_number: idNumber,
    legal_agreement_version: legalAgreementVersion,
    legal_agreed_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, participant_type: participantType, ...extra }, emailRedirectTo: `${getSiteUrl()}/auth/confirm` } })
  if (error) {
    if (error.code === 'request_timeout' || error.name === 'AuthRetryableFetchError' || (error.status ?? 0) >= 500) {
      console.error('Signup confirmation unavailable', { status: error.status, code: error.code })
      after(() => trackRegistrationFailure(email, fullName, participantType))
      redirect(`/resume-registration?${new URLSearchParams({ email, status: 'signup-pending' })}`)
    }
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      redirect(`/resume-registration?email=${encodeURIComponent(email)}`)
    }
    if (error.status === 429) {
      redirect(withMessage('/register', 'error', 'Registration is temporarily rate limited. Wait a few minutes before trying again.'))
    }
    redirect(withMessage('/register', 'error', 'We could not create your account. Check your registration details and try again.'))
  }
  // Supabase deliberately returns a user with no identities for a repeated signup.
  // Never send that person to a misleading "new code sent" screen.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    redirect(`/resume-registration?email=${encodeURIComponent(email)}`)
  }
  if (data.session) {
    await clearRegistrationFollowup(email)
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }
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
  await clearRegistrationFollowup(email)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function resendVerificationCode(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const back = `/verify-email?email=${encodeURIComponent(email)}`
  if (validateEmail(email)) redirect('/register')
  if (!(await allow('resend_code', 3, 600, email))) redirect(withMessage(back, 'error', 'Please wait before requesting another code.'))
  const supabase = await createClient(registrationEmailFetch)
  const result = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/confirm` },
  }).catch(() => null)
  const error = result?.error

  if (!result || error) {
    console.error('Verification email resend failed', { status: error?.status, code: error?.code })
    if (error?.status === 429) {
      redirect(withMessage(back, 'error', 'Please wait before requesting another code.'))
    }
    if (!result || (error && error.code !== 'user_not_found' && error.code !== 'email_already_confirmed')) {
      redirect(withMessage(back, 'error', 'We could not request a new verification email right now. Try again later or contact the membership team.'))
    }
  }

  redirect(withMessage(back, 'message', 'If this address still needs verification, check your inbox and spam folder for a new code. If you already confirmed it, use Continue Existing Account below.'))
}

export async function resumeRegistration(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (validateEmail(email)) redirect(withMessage('/resume-registration', 'error', 'Enter a valid email address.'))
  if (!(await allow('resume_registration', 4, 900, email))) redirect(withMessage('/resume-registration', 'error', 'Too many attempts. Try again in 15 minutes.'))

  const supabase = await createClient(registrationEmailFetch)

  // Do not reveal whether the address exists or whether it is already confirmed.
  // Confirmed accounts receive a password continuation link; unfinished accounts
  // receive a fresh signup-confirmation message. Unknown addresses receive neither.
  const results = await Promise.allSettled([
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/confirm?next=/reset-password`,
    }),
    supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/confirm` },
    }),
  ])
  for (const result of results) {
    if (result.status === 'rejected') console.error('Registration continuation request failed')
    else if (result.value.error) {
      console.error('Registration continuation error', {
        status: result.value.error.status, code: result.value.error.code,
      })
    }
  }

  const unavailable = results.every(result => result.status === 'rejected' ||
    (result.value.error && (result.value.error.name === 'AuthRetryableFetchError' ||
      (result.value.error.status ?? 0) >= 500 || result.value.error.code === 'request_timeout')))
  if (unavailable) {
    redirect(withMessage(`/resume-registration?email=${encodeURIComponent(email)}`, 'error',
      'We could not confirm the email request. Try again shortly or contact the membership team.'))
  }

  redirect(withMessage(
    `/resume-registration?email=${encodeURIComponent(email)}`,
    'message',
    'Check your inbox and spam folder for a WTC Accra email. If no email arrives, return to registration to try again or contact the membership team for help.',
  ))
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
  const claims = claimsData?.claims
  if (!claims?.sub || !(await hasPasswordRecoveryGrant(claims.session_id))) {
    redirect(withMessage('/forgot-password', 'error', 'Open a fresh password email before choosing a new password.'))
  }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) redirect(withMessage('/reset-password', 'error', 'Unable to update the password.'))
  const cookieStore = await cookies()
  cookieStore.delete(recoveryCookie)
  if (typeof claims.email === 'string') {
    try {
      const { error: emailError } = await createAdminClient().from('outbound_emails').insert({
        to_email: claims.email, to_user_id: claims.sub, kind: 'password_changed',
        subject: 'Your WTC Accra Hub password was changed',
        body: 'Your WTC Accra Hub password was changed. If you did not make this change, contact membership@wtcaccra.com.',
      })
      if (emailError) console.error('Password change notice could not be queued', emailError.code)
    } catch {
      console.error('Password change notice could not be queued')
    }
  }
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
