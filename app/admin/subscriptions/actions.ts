'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function reviewSubscription(formData: FormData) {
  const subscriptionId = String(formData.get('subscriptionId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const validUntil = String(formData.get('validUntil') ?? '').trim()
  const target = '/admin/subscriptions'
  if (!subscriptionId || !['activate', 'cancel'].includes(decision)) {
    redirect(`${target}?error=${encodeURIComponent('Invalid subscription decision.')}`)
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('review_subscription', {
    subscription_id: subscriptionId,
    decision,
    valid_until: validUntil ? new Date(`${validUntil}T23:59:59Z`).toISOString() : null,
  })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/subscriptions')
  redirect(`${target}?message=${encodeURIComponent('Subscription updated. Marketplace access follows immediately.')}`)
}
