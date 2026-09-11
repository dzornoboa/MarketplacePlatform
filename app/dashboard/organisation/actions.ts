'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/dashboard/organisation?${key}=${encodeURIComponent(message)}`
}

/* Creating an organisation makes the creator its owner — handle_new_organization()
   inserts the organization_members row, so no client-side race. */
export async function createOrganisation(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const website = String(formData.get('website') ?? '').trim()
  if (name.length < 2 || name.length > 160) redirect(back('error', 'Organisation name must be between 2 and 160 characters.'))
  if (website && !website.startsWith('https://')) redirect(back('error', 'Website must start with https://.'))

  const { error } = await supabase.from('organizations').insert({
    name,
    registration_number: String(formData.get('registrationNumber') ?? '').trim() || null,
    website: website || null,
    country: String(formData.get('country') ?? '').trim() || null,
    city: String(formData.get('city') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
    created_by: String(userId),
  })
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/organisation')
  redirect(back('message', 'Organisation created. WTC Accra will verify it during your next review.'))
}

export async function updateOrganisation(formData: FormData) {
  const id = String(formData.get('organisationId') ?? '')
  if (!id) redirect(back('error', 'Organisation not found.'))
  const name = String(formData.get('name') ?? '').trim()
  const website = String(formData.get('website') ?? '').trim()
  if (name.length < 2 || name.length > 160) redirect(back('error', 'Organisation name must be between 2 and 160 characters.'))
  if (website && !website.startsWith('https://')) redirect(back('error', 'Website must start with https://.'))

  const supabase = await createClient()
  const { error } = await supabase.from('organizations').update({
    name,
    registration_number: String(formData.get('registrationNumber') ?? '').trim() || null,
    website: website || null,
    country: String(formData.get('country') ?? '').trim() || null,
    city: String(formData.get('city') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
  }).eq('id', id)
  if (error) redirect(back('error', error.message))
  revalidatePath('/dashboard/organisation')
  redirect(back('message', 'Organisation updated.'))
}
