'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function to(path: string, key: 'error' | 'message', message: string) {
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(message)}`
}

const KINDS = new Set(['investment', 'trade', 'procurement', 'partnership'])

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/* Creates a draft. RLS (opportunities_insert_verified_owner) independently
   re-checks verification, the posting switch and the participant type. */
export async function createOpportunity(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const summary = String(formData.get('summary') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const sector = String(formData.get('sector') ?? '').trim()
  const country = String(formData.get('country') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const kind = String(formData.get('kind') ?? '')
  const currency = String(formData.get('currency') ?? 'USD').trim().toUpperCase()
  const deadline = String(formData.get('deadline') ?? '').trim()
  const tags = String(formData.get('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 12)

  if (title.length < 5 || title.length > 180) redirect(to('/dashboard/opportunities/new', 'error', 'Title must be between 5 and 180 characters.'))
  if (summary.length < 20 || summary.length > 700) redirect(to('/dashboard/opportunities/new', 'error', 'Summary must be between 20 and 700 characters.'))
  if (description.length < 50) redirect(to('/dashboard/opportunities/new', 'error', 'Description must be at least 50 characters.'))
  if (!sector || !country) redirect(to('/dashboard/opportunities/new', 'error', 'Sector and country are required.'))
  if (!KINDS.has(kind)) redirect(to('/dashboard/opportunities/new', 'error', 'Select an opportunity type.'))
  if (!/^[A-Z]{3}$/.test(currency)) redirect(to('/dashboard/opportunities/new', 'error', 'Currency must be a 3-letter code such as USD or GHS.'))

  const { data, error } = await supabase.from('opportunities').insert({
    owner_user_id: String(userId),
    title, summary, description, sector, country,
    city: city || null,
    kind: kind as 'investment' | 'trade' | 'procurement' | 'partnership',
    capital_required: optionalNumber(formData.get('capitalRequired')),
    minimum_ticket: optionalNumber(formData.get('minimumTicket')),
    currency,
    deadline: deadline || null,
    tags,
    status: 'draft',
  }).select('id').single()

  if (error || !data) redirect(to('/dashboard/opportunities/new', 'error', error?.message ?? 'Unable to save the opportunity.'))
  revalidatePath('/dashboard/opportunities')
  redirect(to('/dashboard/opportunities', 'message', 'Draft saved. Submit it when you are ready for WTC Accra review.'))
}

/* Draft -> submitted. submit_opportunity() writes the status event and
   notifies the trade desk. */
export async function submitOpportunity(formData: FormData) {
  const id = String(formData.get('opportunityId') ?? '')
  if (!id) redirect(to('/dashboard/opportunities', 'error', 'Opportunity not found.'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('submit_opportunity', { opportunity_id: id })
  if (error) redirect(to('/dashboard/opportunities', 'error', error.message))
  revalidatePath('/dashboard/opportunities')
  redirect(to('/dashboard/opportunities', 'message', 'Submitted for WTC Accra review.'))
}

export async function expressInterest(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const message = String(formData.get('message') ?? '').trim()
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')
  if (message.length < 20 || message.length > 3000) redirect(to('/dashboard/opportunities', 'error', 'Your message must be between 20 and 3000 characters.'))
  const { error } = await supabase.from('expressions_of_interest').insert({
    opportunity_id: opportunityId, applicant_id: String(userId), message, status: 'submitted',
  })
  if (error) redirect(to('/dashboard/opportunities', 'error', error.message))
  revalidatePath('/dashboard/interests')
  redirect(to('/dashboard/interests', 'message', 'Expression of interest sent to the opportunity owner.'))
}

export async function respondToInterest(formData: FormData) {
  const id = String(formData.get('eoiId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('ownerNote') ?? '').trim()
  const allowed: Record<string, 'under_review' | 'accepted' | 'declined'> = {
    review: 'under_review', accept: 'accepted', decline: 'declined',
  }
  const status = allowed[decision]
  if (!id || !status) redirect(to('/dashboard/interests', 'error', 'Invalid response.'))
  const supabase = await createClient()
  const { error } = await supabase.from('expressions_of_interest')
    .update({ status, owner_note: note || null }).eq('id', id)
  if (error) redirect(to('/dashboard/interests', 'error', error.message))
  revalidatePath('/dashboard/interests')
  redirect(to('/dashboard/interests', 'message', 'Response recorded.'))
}
