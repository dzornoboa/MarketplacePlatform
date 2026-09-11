'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = new Set(['shortlisted', 'contacted', 'dismissed'])

/* A member may move their own match through the pipeline. private.protect_match_fields()
   stops them editing the score or rationale the trade desk set. */
export async function updateMatchStatus(formData: FormData) {
  const matchId = String(formData.get('matchId') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!matchId || !ALLOWED.has(status)) {
    redirect(`/dashboard/matches?error=${encodeURIComponent('Invalid match update.')}`)
  }
  const supabase = await createClient()
  const { error } = await supabase.from('matches')
    .update({ status: status as 'shortlisted' }).eq('id', matchId)
  if (error) redirect(`/dashboard/matches?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard/matches')
  redirect(`/dashboard/matches?message=${encodeURIComponent('Match updated.')}`)
}
