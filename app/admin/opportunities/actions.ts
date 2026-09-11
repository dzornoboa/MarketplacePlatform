'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
  const supabase = await createClient()
  const { error } = await supabase.rpc('review_opportunity', {
    opportunity_id: opportunityId, decision, reviewer_note: note || null,
  })
  if (error) redirect(`${target}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin/opportunities')
  revalidatePath('/dashboard/opportunities')
  redirect(`${target}?message=${encodeURIComponent('Decision recorded and the owner notified.')}`)
}
