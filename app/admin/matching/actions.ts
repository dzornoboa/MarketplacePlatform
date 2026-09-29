'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/admin/matching?${key}=${encodeURIComponent(message)}`
}

export async function createStaffMatch(formData: FormData) {
  const userId = String(formData.get('userId') ?? '')
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const score = Math.max(0, Math.min(100, Number(formData.get('score') ?? 50)))
  const rationale = String(formData.get('rationale') ?? '').trim() || null
  if (!userId || !opportunityId || !Number.isFinite(score)) redirect(back('error', 'Choose a member, opportunity and valid score.'))

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) redirect(back('error', 'Your session is unavailable.'))

  const { error } = await supabase.from('matches').upsert({
    user_id: userId,
    opportunity_id: opportunityId,
    created_by: userData.user.id,
    score: Math.round(score),
    rationale,
    status: 'suggested',
  }, { onConflict: 'user_id,opportunity_id' })

  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/matching'); revalidatePath('/dashboard/matches')
  redirect(back('message', 'Match saved and is now visible to the member.'))
}

export async function updateStaffMatch(formData: FormData) {
  const matchId = String(formData.get('matchId') ?? '')
  const score = Math.max(0, Math.min(100, Number(formData.get('score') ?? 50)))
  const rationale = String(formData.get('rationale') ?? '').trim() || null
  if (!matchId || !Number.isFinite(score)) redirect(back('error', 'Invalid match update.'))

  const supabase = await createClient()
  const { error } = await supabase.from('matches').update({ score: Math.round(score), rationale }).eq('id', matchId)
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/matching'); revalidatePath('/dashboard/matches')
  redirect(back('message', 'Match updated.'))
}

export async function removeStaffMatch(formData: FormData) {
  const matchId = String(formData.get('matchId') ?? '')
  if (!matchId) redirect(back('error', 'Match not found.'))
  const supabase = await createClient()
  const { error } = await supabase.from('matches').delete().eq('id', matchId)
  if (error) redirect(back('error', error.message))
  revalidatePath('/admin/matching'); revalidatePath('/dashboard/matches')
  redirect(back('message', 'Match removed.'))
}
