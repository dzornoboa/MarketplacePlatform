'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { validatePassword } from '@/lib/auth/validation'

const back = (key: 'error' | 'message', msg: string) => `/dashboard/security?${key}=${encodeURIComponent(msg)}`

/* Change password from inside the dashboard. The current password is
   re-checked with a fresh sign-in before the new one is set, so a stolen
   open session cannot silently take over the account. */
export async function changePassword(formData: FormData) {
  const current = String(formData.get('currentPassword') ?? '')
  const next = String(formData.get('newPassword') ?? '')
  const confirm = String(formData.get('confirmPassword') ?? '')
  if (!current) redirect(back('error', 'Enter your current password.'))
  const problem = validatePassword(next)
  if (problem) redirect(back('error', problem))
  if (next !== confirm) redirect(back('error', 'The new passwords do not match.'))
  if (next === current) redirect(back('error', 'Choose a password different from the current one.'))
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const email = typeof claimsData?.claims?.email === 'string' ? claimsData.claims.email : null
  if (!email) redirect('/login')
  // Check with a throw-away client so a wrong guess never disturbs the real session cookie.
  const probe = createPublicClient()
  const { error: checkError } = await probe.auth.signInWithPassword({ email, password: current })
  if (checkError) redirect(back('error', 'The current password is incorrect.'))
  await probe.auth.signOut({ scope: 'local' }).catch(() => undefined)
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) redirect(back('error', error.message))
  redirect(back('message', 'Password changed. Use the new password next time you sign in.'))
}
