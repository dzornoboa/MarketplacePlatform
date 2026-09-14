'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const back = (key: 'error' | 'message', msg: string) => `/dashboard/billing?${key}=${encodeURIComponent(msg)}&section=payment-details#payment-details`
const s = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

async function me() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ? String(data.claims.sub) : null
  if (!userId) redirect('/login')
  return { supabase, userId }
}

/* Billing address used on invoices and sent with checkouts. One per member. */
export async function saveBillingAddress(formData: FormData) {
  const { supabase, userId } = await me()
  const billingName = s(formData, 'billingName'), line1 = s(formData, 'line1'), city = s(formData, 'city'), country = s(formData, 'country')
  if (!billingName || !line1 || !city || !country) redirect(back('error', 'Name, address line 1, city and country are required.'))
  const email = s(formData, 'email')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(back('error', 'Enter a valid billing email.'))
  const { error } = await supabase.from('billing_addresses').upsert({
    user_id: userId, billing_name: billingName, company: s(formData, 'company') || null, tax_id: s(formData, 'taxId') || null,
    email: email || null, phone: s(formData, 'phone') || null, line1, line2: s(formData, 'line2') || null, city,
    region: s(formData, 'region') || null, postal_code: s(formData, 'postalCode') || null, country, updated_at: new Date().toISOString(),
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/billing')
  redirect(back('message', 'Billing address saved.'))
}

/* Cards are stored as brand + last four + expiry only. The full number is
   used once, here, to derive those and is never written anywhere. Live
   gateways tokenise the card and set provider_token instead. */
function cardBrand(number: string): string {
  if (/^4/.test(number)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard'
  if (/^3[47]/.test(number)) return 'American Express'
  if (/^6(?:011|5)/.test(number)) return 'Discover'
  if (/^50/.test(number)) return 'Verve'
  return 'Card'
}
function luhnOk(number: string): boolean {
  let sum = 0, dbl = false
  for (let i = number.length - 1; i >= 0; i--) { let d = Number(number[i]); if (dbl) { d *= 2; if (d > 9) d -= 9 } sum += d; dbl = !dbl }
  return sum % 10 === 0
}

export async function savePaymentMethod(formData: FormData) {
  const { supabase, userId } = await me()
  const id = s(formData, 'methodId')
  const kind = s(formData, 'kind')
  const makePrimary = s(formData, 'makePrimary') === 'on'
  let row: Record<string, unknown>

  if (kind === 'card') {
    const number = s(formData, 'cardNumber').replace(/[\s-]/g, '')
    const holder = s(formData, 'holderName')
    const expMonth = Number(s(formData, 'expMonth')), expYear = Number(s(formData, 'expYear'))
    if (!holder) redirect(back('error', 'Enter the name on the card.'))
    if (!(expMonth >= 1 && expMonth <= 12) || !(expYear >= new Date().getFullYear() && expYear <= 2100)) redirect(back('error', 'Enter a valid expiry month and year.'))
    if (expYear === new Date().getFullYear() && expMonth < new Date().getMonth() + 1) redirect(back('error', 'That card has expired.'))
    if (id && !number) {
      // editing an existing card without re-entering the number: update holder/expiry only
      row = { holder_name: holder, exp_month: expMonth, exp_year: expYear, label: s(formData, 'label') || null }
    } else {
      if (!/^[0-9]{12,19}$/.test(number) || !luhnOk(number)) redirect(back('error', 'Enter a valid card number.'))
      row = { kind: 'card', brand: cardBrand(number), last4: number.slice(-4), exp_month: expMonth, exp_year: expYear, holder_name: holder, label: s(formData, 'label') || null, provider: 'manual' }
    }
  } else if (kind === 'mobile_money') {
    const network = s(formData, 'momoNetwork'), phone = s(formData, 'momoNumber').replace(/[\s-]/g, '')
    if (!['MTN', 'Telecel', 'AirtelTigo'].includes(network)) redirect(back('error', 'Choose the mobile-money network.'))
    if (!/^\+?[0-9]{9,15}$/.test(phone)) redirect(back('error', 'Enter a valid mobile-money number.'))
    row = { kind: 'mobile_money', momo_network: network, momo_number: phone, holder_name: s(formData, 'holderName') || null, label: s(formData, 'label') || null, last4: phone.slice(-4), provider: 'manual' }
  } else if (kind === 'bank_transfer') {
    const bank = s(formData, 'bankName')
    if (!bank) redirect(back('error', 'Enter the bank you will pay from.'))
    row = { kind: 'bank_transfer', bank_name: bank, holder_name: s(formData, 'holderName') || null, label: s(formData, 'label') || null, provider: 'manual' }
  } else redirect(back('error', 'Choose a payment method type.'))

  let methodId = id
  if (id) {
    const { error } = await supabase.from('payment_methods').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId)
    if (error) redirect(back('error', error.message))
  } else {
    const { data, error } = await supabase.from('payment_methods').insert({ user_id: userId, kind: kind as 'card', ...row }).select('id').single()
    if (error || !data) redirect(back('error', error?.message ?? 'Could not save the payment method.'))
    methodId = data.id
  }
  if (makePrimary && methodId) await supabase.rpc('set_primary_payment_method', { method_id: methodId })
  revalidatePath('/dashboard/billing')
  redirect(back('message', id ? 'Payment method updated.' : 'Payment method saved.'))
}

export async function setPrimaryPaymentMethod(formData: FormData) {
  const { supabase } = await me()
  const id = s(formData, 'methodId')
  const { error } = await supabase.rpc('set_primary_payment_method', { method_id: id })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/billing')
  redirect(back('message', 'Primary payment method updated.'))
}

export async function removePaymentMethod(formData: FormData) {
  const { supabase, userId } = await me()
  const id = s(formData, 'methodId')
  const { data: victim } = await supabase.from('payment_methods').select('is_primary').eq('id', id).eq('user_id', userId).maybeSingle()
  const { error } = await supabase.from('payment_methods').delete().eq('id', id).eq('user_id', userId)
  if (error) redirect(back('error', error.message))
  if (victim?.is_primary) {
    const { data: next } = await supabase.from('payment_methods').select('id').eq('user_id', userId).order('created_at').limit(1).maybeSingle()
    if (next) await supabase.rpc('set_primary_payment_method', { method_id: next.id })
  }
  revalidatePath('/dashboard/billing')
  redirect(back('message', 'Payment method removed.'))
}
