'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUserProfile } from '@/lib/auth/guards'
import { isKnownParticipantType } from '@/lib/auth/access'

export async function updateProfile(formData: FormData) {
  const { supabase, profile } = await requireUserProfile()
  const fullName = String(formData.get('fullName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim() || null
  const jobTitle = String(formData.get('jobTitle') ?? '').trim() || null
  const country = String(formData.get('country') ?? '').trim() || null
  const city = String(formData.get('city') ?? '').trim() || null
  const requested = String(formData.get('participantType') ?? profile.requested_participant_type ?? '')
  if (fullName.length < 2) redirect('/dashboard/profile?error=Enter%20your%20full%20name.')
  if (!isKnownParticipantType(requested) || requested === 'staff') redirect('/dashboard/profile?error=Select%20a%20valid%20participant%20type.')
  const { error } = await supabase.from('profiles').update({ full_name: fullName, phone, job_title: jobTitle, country, city, requested_participant_type: requested, profile_completed: true }).eq('id', profile.id)
  if (error) redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/profile?message=Profile%20saved.')
}
