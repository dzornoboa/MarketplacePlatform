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

/* Profile photo: stored in the public avatars bucket under the member's own
   folder; the URL is saved on the profile and used everywhere the member
   appears (sidebar, directory, listings, bids, deal rooms, consoles). */
export async function uploadAvatar(formData: FormData) {
  const { supabase, profile } = await requireUserProfile()
  const file = formData.get('avatar')
  if (!(file instanceof File) || file.size === 0) redirect('/dashboard/profile?error=Choose%20an%20image%20first.')
  if (file.size > 5 * 1024 * 1024) redirect('/dashboard/profile?error=Images%20must%20be%205MB%20or%20smaller.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) redirect('/dashboard/profile?error=Use%20a%20JPG%2C%20PNG%20or%20WebP%20image.')
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${profile.id}/avatar-${Date.now().toString(36)}.${ext}`
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true })
  if (uploadError) redirect(`/dashboard/profile?error=${encodeURIComponent(`Upload failed: ${uploadError.message}`)}`)
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id)
  if (error) redirect(`/dashboard/profile?error=${encodeURIComponent(error.message)}`)
  // Tidy the previous file so the bucket does not accumulate old photos.
  const old = profile.avatar_url?.split('/avatars/')[1]
  if (old && old !== path) await supabase.storage.from('avatars').remove([old]).catch(() => undefined)
  revalidatePath('/', 'layout')
  redirect('/dashboard/profile?message=Profile%20photo%20updated.')
}

export async function removeAvatar() {
  const { supabase, profile } = await requireUserProfile()
  const old = profile.avatar_url?.split('/avatars/')[1]
  if (old) await supabase.storage.from('avatars').remove([old]).catch(() => undefined)
  await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
  revalidatePath('/', 'layout')
  redirect('/dashboard/profile?message=Profile%20photo%20removed.')
}
