'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/redirects'
import { validateEmail, validatePassword, validateSignupInput } from '@/lib/auth/validation'
import { getSiteUrl } from '@/lib/supabase/config'

function withMessage(path: string, key: 'error' | 'message', message: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${key}=${encodeURIComponent(message)}`
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(String(formData.get('next') ?? '/dashboard'))
  if (validateEmail(email) || !password) redirect(withMessage('/login', 'error', 'Enter a valid email address and password.'))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(withMessage('/login', 'error', 'Invalid email or password.'))
  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const participantType = String(formData.get('participantType') ?? '')
  const validation = validateSignupInput({ fullName, email, password, participantType })
  if (!validation.ok) redirect(withMessage('/register', 'error', Object.values(validation.errors)[0] ?? 'Check your registration details.'))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, participant_type: participantType }, emailRedirectTo: `${getSiteUrl()}/auth/confirm` } })
  if (error) redirect(withMessage('/register', 'error', error.message))
  if (data.session) { revalidatePath('/', 'layout'); redirect('/dashboard') }
  redirect(withMessage('/login', 'message', 'Check your email to confirm your account before signing in.'))
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (validateEmail(email)) redirect(withMessage('/forgot-password', 'error', 'Enter a valid email address.'))
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
