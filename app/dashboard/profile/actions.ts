'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUserProfile } from '@/lib/auth/guards'
import { isSelectableParticipantType } from '@/lib/auth/access'
import type { Database } from '@/lib/database.types'

export async function updateProfile(formData: FormData) {
  const { supabase, profile } = await requireUserProfile()
  const fullName = String(formData.get('fullName') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim() || null
  const jobTitle = String(formData.get('jobTitle') ?? '').trim() || null
  const country = String(formData.get('country') ?? '').trim() || null
  const city = String(formData.get('city') ?? '').trim() || null
  if (fullName.length < 2) redirect('/dashboard/profile?error=Enter%20your%20full%20name.')

  const patch: Database['public']['Tables']['profiles']['Update'] = {
    full_name: fullName, phone, job_title: jobTitle, country, city,
  }

  /* The participant type is locked once verified (the select is disabled, so
     the browser does not even submit it) and is never chosen by staff. Only an
     unverified member picks one, and only from the selectable list. */
  const typeLocked = profile.verification_status === 'verified' || profile.system_role !== 'user'
  if (!typeLocked) {
    const requested = String(formData.get('participantType') ?? '')
    if (!isSelectableParticipantType(requested)) redirect('/dashboard/profile?error=Select%20a%20valid%20participant%20type.')
    patch.requested_participant_type = requested
    patch.profile_completed = true
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id)
  if (error) redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/profile?message=Profile%20saved.')
}
