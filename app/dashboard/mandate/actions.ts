'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/mandate?${key}=${encodeURIComponent(message)}`
}

function list(value: FormDataEntryValue | null): string[] {
  return String(value ?? '').split(',').map(v => v.trim()).filter(Boolean).slice(0, 15)
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function currencyOf(value: FormDataEntryValue | null): string | null {
  const code = String(value ?? 'USD').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : null
}

/* Investor mandates and buyer requirements tell the trade desk what to match
   this member against. One active record each is enough for the desk to work. */
export async function saveMandate(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const id = String(formData.get('mandateId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const currency = currencyOf(formData.get('currency'))
  if (title.length < 3) redirect(back('error', 'Give the mandate a title of at least 3 characters.'))
  if (!currency) redirect(back('error', 'Currency must be a 3-letter code such as USD or GHS.'))

  const payload = {
    user_id: String(userId),
    title,
    sectors: list(formData.get('sectors')),
    geographies: list(formData.get('geographies')),
    ticket_min: optionalNumber(formData.get('ticketMin')),
    ticket_max: optionalNumber(formData.get('ticketMax')),
    currency,
    notes: String(formData.get('notes') ?? '').trim() || null,
    active: String(formData.get('active') ?? '') === 'on',
  }

  const { error } = id
    ? await supabase.from('investor_mandates').update(payload).eq('id', id)
    : await supabase.from('investor_mandates').insert(payload)
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/mandate')
  redirect(back('message', 'Investment mandate saved.'))
}

export async function saveRequirement(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const id = String(formData.get('requirementId') ?? '')
  const title = String(formData.get('title') ?? '').trim()
  const requirement = String(formData.get('requirement') ?? '').trim()
  const currency = currencyOf(formData.get('currency'))
  if (title.length < 3) redirect(back('error', 'Give the requirement a title of at least 3 characters.'))
  if (requirement.length < 10) redirect(back('error', 'Describe what you are sourcing in at least 10 characters.'))
  if (!currency) redirect(back('error', 'Currency must be a 3-letter code such as USD or GHS.'))

  const payload = {
    user_id: String(userId),
    title,
    requirement,
    sectors: list(formData.get('sectors')),
    geographies: list(formData.get('geographies')),
    budget_min: optionalNumber(formData.get('budgetMin')),
    budget_max: optionalNumber(formData.get('budgetMax')),
    currency,
    active: String(formData.get('active') ?? '') === 'on',
  }

  const { error } = id
    ? await supabase.from('buyer_requirements').update(payload).eq('id', id)
    : await supabase.from('buyer_requirements').insert(payload)
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/mandate')
  redirect(back('message', 'Buying requirement saved.'))
}
