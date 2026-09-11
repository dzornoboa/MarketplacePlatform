'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/billing?${key}=${encodeURIComponent(message)}`
}

/* Members request a plan; finance staff activate it once payment clears.
   request_subscription() enforces eligibility and creates the pending row. */
export async function requestSubscription(formData: FormData) {
  const planCode = String(formData.get('planCode') ?? '').trim()
  if (!planCode) redirect(back('error', 'Select a plan first.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('request_subscription', { plan_code: planCode })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/billing')
  redirect(back('message', 'Subscription requested. WTC Accra finance will confirm once payment is received.'))
}

export async function requestMembership(formData: FormData) {
  const code = String(formData.get('membershipTypeCode') ?? '').trim()
  if (!code) redirect(back('error', 'Select a membership type first.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('request_membership', { membership_type_code: code })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/billing')
  redirect(back('message', 'Membership requested. WTC Accra will review your application.'))
}
