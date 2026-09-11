'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/settings?${key}=${encodeURIComponent(message)}`
}

/* user_preferences is keyed on user_id with RLS scoped to the owner, so an
   upsert is safe: a member can only ever write their own row. */
export async function updatePreferences(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const timezone = String(formData.get('timezone') ?? '').trim()
  const locale = String(formData.get('locale') ?? '').trim()
  if (timezone.length < 3 || timezone.length > 80) redirect(back('error', 'Enter a valid timezone.'))
  if (locale.length < 2 || locale.length > 20) redirect(back('error', 'Enter a valid locale.'))

  const on = (name: string) => String(formData.get(name) ?? '') === 'on'
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: String(userId),
    email_notifications: on('emailNotifications'),
    opportunity_updates: on('opportunityUpdates'),
    introduction_updates: on('introductionUpdates'),
    membership_updates: on('membershipUpdates'),
    marketing_emails: on('marketingEmails'),
    timezone,
    locale,
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/settings')
  redirect(back('message', 'Preferences saved.'))
}
