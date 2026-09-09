'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUserProfile } from '@/lib/auth/guards'

export async function submitVerification(formData: FormData) {
  const { supabase, profile } = await requireUserProfile()
  const note = String(formData.get('note') ?? '').trim() || null
  if (!profile.profile_completed || !profile.requested_participant_type) redirect('/dashboard/profile?error=Complete%20your%20profile%20before%20submitting%20verification.')
  if (profile.verification_status === 'verified' || profile.verification_status === 'pending_review') redirect('/dashboard/verification')
  if (profile.verification_status === 'suspended') redirect('/dashboard?locked=suspended')
  const { error } = await supabase.rpc('submit_verification_request', { submission_note: note })
  if (error) redirect(`/dashboard/verification?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/verification?message=Verification%20submitted%20for%20review.')
}
