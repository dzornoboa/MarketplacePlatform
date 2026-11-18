'use server'

import { moderationError } from '@/lib/ai/content-moderation'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireCapability } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

const DECISIONS = new Set(['publish', 'changes', 'reject'])

export async function reviewOpportunity(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('reviewerNote') ?? '').trim()
  const target = `/admin/opportunities`
  if (!opportunityId || !DECISIONS.has(decision)) {
    redirect(`${target}?error=${encodeURIComponent('Invalid review decision.')}`)
  }
  const { supabase } = await requireCapability('opportunities')
  if (decision === 'publish') {
    const { data: listing } = await supabase.from('opportunities')
      .select('owner_user_id,title,summary,description,sector,country,city,region,tags').eq('id', opportunityId).maybeSingle()
    if (!listing) redirect(`${target}?error=Opportunity%20not%20found.`)
    const { owner_user_id, ...content } = listing
    const screening = await moderationError('opportunity publication', Object.values(content).flat().join('\n'), { submittedBy: owner_user_id, allowUnavailable: formData.get('manualReview') === 'on' })
    if (screening) redirect(`${target}?error=${encodeURIComponent(screening)}`)
  }
  const { error } = await supabase.rpc('review_opportunity', {
    opportunity_id: opportunityId, decision, reviewer_note: note || null,
  })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/opportunities')
  revalidatePath('/dashboard/opportunities')
  redirect(`${target}?message=${encodeURIComponent('Decision recorded and the owner notified.')}`)
}

/* The deal rating and region are WTC Accra judgements — the protect trigger
   rejects them from anyone without the opportunities capability, so this is the
   only place they can be set. */
export async function setDealGrading(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const importance = Number(formData.get('importance') ?? 3)
  const region = String(formData.get('region') ?? '').trim()
  const target = '/admin/opportunities'
  if (!opportunityId) redirect(`${target}?error=${encodeURIComponent('Opportunity not found.')}`)
  if (!Number.isInteger(importance) || importance < 1 || importance > 5) {
    redirect(`${target}?error=${encodeURIComponent('Rating must be between 1 and 5.')}`)
  }

  const supabase = await createClient()
  const { error } = await supabase.from('opportunities')
    .update({ importance, region: region || null }).eq('id', opportunityId)
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/opportunities')
  revalidatePath('/dashboard/feed')
  redirect(`${target}?message=${encodeURIComponent('Deal rating updated.')}`)
}

/* Deal rooms are staff-created by policy. Opening one adds the owner
   automatically via the add_deal_room_owner trigger. */
export async function openDealRoom(formData: FormData) {
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const target = '/admin/opportunities'
  if (!opportunityId) redirect(`${target}?error=${encodeURIComponent('Opportunity not found.')}`)

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const { data: existing } = await supabase.from('deal_rooms')
    .select('id').eq('opportunity_id', opportunityId).maybeSingle()
  if (existing) redirect(`${target}?message=${encodeURIComponent('A deal room is already open for this listing.')}`)

  const { error } = await supabase.from('deal_rooms')
    .insert({ opportunity_id: opportunityId, created_by: String(userId) })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/opportunities')
  revalidatePath('/dashboard/deal-rooms')
  redirect(`${target}?message=${encodeURIComponent('Deal room opened. Add the counterparty from the deal room.')}`)
}
