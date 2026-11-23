'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'

const back = (key: 'error' | 'message', msg: string) => `/dashboard/security?${key}=${encodeURIComponent(msg)}`
const unavailable = 'Could not request your password email. Try again shortly or contact WTC Accra support.'

export async function emailPasswordReset() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')
  if (!(await allow('password_reset', 3, 900, user.email.toLowerCase()))) {
    redirect(back('error', 'Too many requests. Wait 15 minutes before requesting another link.'))
  }

  try {
    const admin = createAdminClient()
    const { error: queueError } = await admin.from('outbound_emails').insert({
      to_email: user.email,
      to_user_id: user.id,
      kind: 'password_reset',
      subject: 'Choose a new password for WTC Accra Hub',
      body: 'A password reset link will be generated when this message is sent.',
    })
    if (queueError) {
      console.error('Dashboard password email could not be queued', queueError.code)
      throw new Error('Password email unavailable')
    }
  } catch {
    redirect(back('error', unavailable))
  }

  redirect(back('message', 'Your password email is queued. Check your inbox and spam folder for a link from WTC Accra Hub.'))
}
