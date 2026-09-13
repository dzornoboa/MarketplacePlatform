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
  revalidatePath('/dashboard/billing'); revalidatePath('/dashboard')
  const { data: plan } = await supabase.from('subscription_plans').select('price_usd,requires_approval').eq('code', planCode).maybeSingle()
  if (plan && Number(plan.price_usd) === 0) redirect(back('message', plan.requires_approval ? 'Plan requested. WTC Accra will confirm your eligibility.' : 'Your free plan is active. The marketplace is open.'))
  redirect('/dashboard/billing?message=' + encodeURIComponent('Plan selected. Complete the payment below to open the marketplace.') + '#pay')
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
  const { data: modeRow } = await supabase.from('site_settings').select('value').eq('key', 'payment_mode').maybeSingle()
  const testMode = (modeRow?.value ?? 'test') !== 'live'
  const useProvider = method !== 'bank_transfer' && !testMode && paystackConfigured()
  // Test mode: card and mobile money go to the simulated checkout page.
  const useTest = method !== 'bank_transfer' && !useProvider && testMode

  // Attach the saved method of the chosen kind (primary first) and a snapshot of the billing address for the receipt.
  const [{ data: savedMethod }, { data: billing }] = await Promise.all([
    supabase.from('payment_methods').select('id').eq('user_id', userId).eq('kind', method as 'card').order('is_primary', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('billing_addresses').select('*').eq('user_id', userId).maybeSingle(),
  ])
  if (!open) {
    const { error } = await supabase.from('payments').insert({
      user_id: userId, subscription_id: subscription.id, plan_code: subscription.plan_code,
      amount: Number(plan.price_usd), currency: 'USD',
      method: method as 'card' | 'mobile_money' | 'bank_transfer',
      provider: useProvider ? 'paystack' : useTest ? 'test' : 'manual', reference, status: 'pending',
      payment_method_id: savedMethod?.id ?? null, billing_snapshot: billing ? (billing as unknown as Record<string, unknown>) : null,
    })
    if (error) redirect(back('error', error.message))
  } else if (open.method !== method) {
    await supabase.from('payments').update({ method: method as 'card' | 'mobile_money' | 'bank_transfer', provider: useProvider ? 'paystack' : useTest ? 'test' : 'manual', payment_method_id: savedMethod?.id ?? null }).eq('id', open.id)
  }

  if (useTest) redirect(`/dashboard/billing/checkout?ref=${encodeURIComponent(reference)}`)

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

/* Test-mode checkout: marks the member's own pending card / mobile-money
   payment as paid. complete_test_payment() refuses once payment_mode is live. */
export async function completeTestPayment(formData: FormData) {
  const paymentId = String(formData.get('paymentId') ?? '')
  const outcome = String(formData.get('outcome') ?? 'success')
  if (!paymentId) redirect(back('error', 'Payment not found.'))
  const supabase = await createClient()
  if (outcome === 'cancel') {
    await supabase.from('payments').update({ status: 'cancelled' }).eq('id', paymentId).eq('status', 'pending')
    revalidatePath('/dashboard/billing')
    redirect(back('message', 'Checkout cancelled. You can start again whenever you are ready.'))
  }
  const { error } = await supabase.rpc('complete_test_payment', { payment_id: paymentId })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/billing'); revalidatePath('/dashboard'); revalidatePath('/admin/payments'); revalidatePath('/admin/subscriptions')
  redirect(back('message', 'Payment received. Your subscription is active and the marketplace is open.'))
}

export async function cancelPlanChange() {
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_pending_subscription')
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/billing')
  redirect(back('message', 'Plan change cancelled.'))
}
