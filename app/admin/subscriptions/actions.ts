'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireCapability } from '@/lib/auth/guards'

export async function reviewSubscription(formData: FormData) {
  const subscriptionId = String(formData.get('subscriptionId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const validUntil = String(formData.get('validUntil') ?? '').trim()
  const target = '/admin/subscriptions'
  if (!subscriptionId || !['activate', 'cancel'].includes(decision)) {
    redirect(`${target}?error=${encodeURIComponent('Invalid subscription decision.')}`)
  }
  const { supabase } = await requireCapability('finance')
  const expiry = decision === 'activate' && validUntil ? new Date(`${validUntil}T23:59:59Z`) : null
  if (expiry && (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || !Number.isFinite(expiry.getTime()) || expiry.toISOString().slice(0, 10) !== validUntil)) {
    redirect(`${target}?error=${encodeURIComponent('Enter a valid expiry date.')}`)
  }
  const { error } = await supabase.rpc('review_subscription', {
    subscription_id: subscriptionId,
    decision,
    valid_until: expiry?.toISOString() ?? null,
  })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/subscriptions')
  redirect(`${target}?message=${encodeURIComponent('Subscription updated. Marketplace access follows immediately.')}`)
}

/* Eligibility approval for restricted plans (WTC members, institutions,
   government). approve_subscription() activates and retires the old plan. */
export async function decideSubscription(formData: FormData) {
  const id = String(formData.get('subscriptionId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  const target = '/admin/subscriptions?status=awaiting_approval'
  if (!id || !['approve', 'decline'].includes(decision)) redirect(`${target}&error=${encodeURIComponent('Invalid decision.')}`)
  const { supabase } = await requireCapability('finance')
  const { error } = await supabase.rpc('approve_subscription', { subscription_id: id, decision, note: note || null })
  if (error) redirect(`${target}&error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/subscriptions'); revalidatePath('/dashboard/billing')
  redirect(`${target}&message=${encodeURIComponent(decision === 'approve' ? 'Plan approved and activated.' : 'Plan declined; the member has been told.')}`)
}
