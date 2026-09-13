'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/* Finance confirms a manual payment against its reference. Marking it paid
   fires the trigger that activates the subscription for a year. */
export async function confirmPayment(formData: FormData) {
  const paymentId = String(formData.get('paymentId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  const target = '/admin/payments'
  if (!paymentId || !['paid', 'failed', 'cancelled', 'refunded'].includes(decision)) {
    redirect(`${target}?error=${encodeURIComponent('Invalid payment decision.')}`)
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('confirm_payment', { payment_id: paymentId, decision, note: note || null })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/payments'); revalidatePath('/admin/subscriptions'); revalidatePath('/dashboard/billing')
  redirect(`${target}?message=${encodeURIComponent(decision === 'paid' ? 'Payment confirmed and the subscription activated.' : `Payment marked ${decision}.`)}`)
}
