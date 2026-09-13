'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/supabase/config'
import { initializeTransaction, paystackConfigured } from '@/lib/payments/paystack'

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

/* Starts a payment for the member's pending subscription. Card and mobile
   money go to Paystack when it is configured; otherwise, and for bank
   transfer, the member gets a reference and instructions and finance confirms
   the payment by hand. Either way a `payments` row is the record. */
export async function startPayment(formData: FormData) {
  const method = String(formData.get('method') ?? '')
  if (!['card', 'mobile_money', 'bank_transfer'].includes(method)) redirect(back('error', 'Choose how you want to pay.'))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null
  const email = typeof claimsData?.claims?.email === 'string' ? claimsData.claims.email : null
  if (!userId) redirect('/login')

  const { data: subscription } = await supabase.from('subscriptions')
    .select('id,plan_code,status').eq('user_id', userId).eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!subscription) redirect(back('error', 'There is no unpaid subscription to pay for.'))

  const { data: plan } = await supabase.from('subscription_plans').select('price_usd,name').eq('code', subscription.plan_code).single()
  if (!plan || Number(plan.price_usd) <= 0) redirect(back('error', 'This plan does not require payment.'))

  // Reuse an open pending payment rather than creating one per click.
  const { data: open } = await supabase.from('payments').select('id,reference,method')
    .eq('subscription_id', subscription.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle()

  const reference = open?.reference ?? `WTC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const useProvider = method !== 'bank_transfer' && paystackConfigured()

  if (!open) {
    const { error } = await supabase.from('payments').insert({
      user_id: userId, subscription_id: subscription.id, plan_code: subscription.plan_code,
      amount: Number(plan.price_usd), currency: 'USD',
      method: method as 'card' | 'mobile_money' | 'bank_transfer',
      provider: useProvider ? 'paystack' : 'manual', reference, status: 'pending',
    })
    if (error) redirect(back('error', error.message))
  }

  if (useProvider && email) {
    try {
      const { authorizationUrl } = await initializeTransaction({
        email, amount: Number(plan.price_usd), currency: 'USD', reference,
        callbackUrl: `${getSiteUrl()}/api/payments/paystack/callback`,
        channels: method === 'card' ? ['card'] : ['mobile_money'],
        metadata: { subscription_id: subscription.id, plan: subscription.plan_code },
      })
      redirect(authorizationUrl)
    } catch (err) {
      if (err && typeof err === 'object' && 'digest' in err) throw err // Next redirect
      redirect(back('error', `Could not start the ${plan.name} payment: ${(err as Error).message}`))
    }
  }

  revalidatePath('/dashboard/billing')
  redirect(`/dashboard/billing?pay=${encodeURIComponent(reference)}`)
}
