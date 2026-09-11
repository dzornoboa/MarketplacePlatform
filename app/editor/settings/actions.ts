'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string) {
  return `/editor/settings?${key}=${encodeURIComponent(message)}`
}

/* Global strings shown across the public site. Keys are fixed by the seed;
   editors change values only. */
export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const updatedBy = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null

  const entries = [...formData.entries()]
    .filter(([key]) => key.startsWith('setting__'))
    .map(([key, value]) => ({ key: key.slice('setting__'.length), value: String(value ?? '').trim() }))
  if (entries.length === 0) redirect(back('error', 'Nothing to save.'))

  for (const entry of entries) {
    const { error } = await supabase.from('site_settings')
      .update({ value: entry.value, updated_by: updatedBy }).eq('key', entry.key)
    if (error) redirect(back('error', `${entry.key}: ${error.message}`))
  }
  revalidatePath('/'); revalidatePath('/news'); revalidatePath('/editor/settings')
  redirect(back('message', 'Website settings updated.'))
}

export async function updateNavLink(formData: FormData) {
  const id = String(formData.get('linkId') ?? '')
  const label = String(formData.get('label') ?? '').trim()
  const href = String(formData.get('href') ?? '').trim()
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0
  const isPublished = String(formData.get('isPublished') ?? '') === 'on'
  if (!id) redirect(back('error', 'Link not found.'))
  if (!label) redirect(back('error', 'A label is required.'))
  if (!(href.startsWith('/') || href.startsWith('#') || href.startsWith('https://'))) {
    redirect(back('error', 'Links must start with /, # or https://.'))
  }
  const supabase = await createClient()
  const { error } = await supabase.from('site_nav_links')
    .update({ label, href, sort_order: sortOrder, is_published: isPublished }).eq('id', id)
  if (error) redirect(back('error', error.message))
  revalidatePath('/'); revalidatePath('/news'); revalidatePath('/editor/settings')
  redirect(back('message', 'Navigation updated.'))
}

export async function createNavLink(formData: FormData) {
  const placement = String(formData.get('placement') ?? '')
  const label = String(formData.get('label') ?? '').trim()
  const href = String(formData.get('href') ?? '').trim()
  const sortOrder = Number(formData.get('sortOrder') ?? 0) || 0
  if (!['header', 'footer_platform', 'footer_access', 'legal'].includes(placement)) redirect(back('error', 'Choose where the link appears.'))
  if (!label) redirect(back('error', 'A label is required.'))
  if (!(href.startsWith('/') || href.startsWith('#') || href.startsWith('https://'))) {
    redirect(back('error', 'Links must start with /, # or https://.'))
  }
  const supabase = await createClient()
  const { error } = await supabase.from('site_nav_links').insert({ placement, label, href, sort_order: sortOrder })
  if (error) redirect(back('error', error.message))
  revalidatePath('/'); revalidatePath('/editor/settings')
  redirect(back('message', 'Navigation link added.'))
}

export async function deleteNavLink(formData: FormData) {
  const id = String(formData.get('linkId') ?? '')
  if (!id) redirect(back('error', 'Link not found.'))
  const supabase = await createClient()
  const { error } = await supabase.from('site_nav_links').delete().eq('id', id)
  if (error) redirect(back('error', error.message))
  revalidatePath('/'); revalidatePath('/editor/settings')
  redirect(back('message', 'Navigation link removed.'))
}
