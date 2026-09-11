'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function back(key: 'error' | 'message', message: string, page = '') {
  const suffix = page ? `page=${encodeURIComponent(page)}&` : ''
  return `/editor/pages?${suffix}${key}=${encodeURIComponent(message)}`
}

const ACCENTS = new Set(['navy', 'orange', 'teal', 'gold', 'sky', 'peach'])

function urlOrNull(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed
}

function badUrl(value: string | null): boolean {
  return !!value && !(value.startsWith('https://') || value.startsWith('/') || value.startsWith('#'))
}

/* Updates one section of a public page. Everything the marketing site renders
   comes from these rows, so an editor changes the live site without a deploy. */
export async function updateBlock(formData: FormData) {
  const id = String(formData.get('blockId') ?? '')
  const pageSlug = String(formData.get('pageSlug') ?? '')
  if (!id) redirect(back('error', 'Section not found.'))

  const heading = String(formData.get('heading') ?? '').trim()
  const accent = String(formData.get('accent') ?? 'navy')
  const ctaHref = urlOrNull(String(formData.get('ctaHref') ?? ''))
  const secondaryHref = urlOrNull(String(formData.get('secondaryCtaHref') ?? ''))
  const imageUrl = urlOrNull(String(formData.get('imageUrl') ?? ''))

  if (heading.length < 2 || heading.length > 240) redirect(back('error', 'Heading must be between 2 and 240 characters.', pageSlug))
  if (!ACCENTS.has(accent)) redirect(back('error', 'Choose a brand accent colour.', pageSlug))
  if (badUrl(ctaHref) || badUrl(secondaryHref)) redirect(back('error', 'Links must start with https://, / or #.', pageSlug))
  if (imageUrl && !(imageUrl.startsWith('https://') || imageUrl.startsWith('/'))) redirect(back('error', 'Image URL must start with https:// or /.', pageSlug))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const { error } = await supabase.from('site_content_blocks').update({
    eyebrow: urlOrNull(String(formData.get('eyebrow') ?? '')),
    heading,
    heading_emphasis: urlOrNull(String(formData.get('headingEmphasis') ?? '')),
    body: urlOrNull(String(formData.get('body') ?? '')),
    cta_label: urlOrNull(String(formData.get('ctaLabel') ?? '')),
    cta_href: ctaHref,
    secondary_cta_label: urlOrNull(String(formData.get('secondaryCtaLabel') ?? '')),
    secondary_cta_href: secondaryHref,
    image_url: imageUrl,
    accent: accent as 'navy',
    is_published: String(formData.get('isPublished') ?? '') === 'on',
    updated_by: claimsData?.claims?.sub ? String(claimsData.claims.sub) : null,
  }).eq('id', id)

  if (error) redirect(back('error', error.message, pageSlug))
  revalidatePath('/'); revalidatePath('/editor/pages')
  redirect(back('message', 'Section updated. The public site refreshes within five minutes.', pageSlug))
}

export async function updateItem(formData: FormData) {
  const id = String(formData.get('itemId') ?? '')
  const pageSlug = String(formData.get('pageSlug') ?? '')
  if (!id) redirect(back('error', 'Item not found.'))

  const heading = String(formData.get('heading') ?? '').trim()
  const accent = String(formData.get('accent') ?? 'navy')
  const imageUrl = urlOrNull(String(formData.get('imageUrl') ?? ''))
  if (!heading) redirect(back('error', 'Item heading is required.', pageSlug))
  if (!ACCENTS.has(accent)) redirect(back('error', 'Choose a brand accent colour.', pageSlug))
  if (imageUrl && !(imageUrl.startsWith('https://') || imageUrl.startsWith('/'))) redirect(back('error', 'Image URL must start with https:// or /.', pageSlug))

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const { error } = await supabase.from('site_content_items').update({
    eyebrow: urlOrNull(String(formData.get('eyebrow') ?? '')),
    heading,
    body: urlOrNull(String(formData.get('body') ?? '')),
    image_url: imageUrl,
    image_alt: urlOrNull(String(formData.get('imageAlt') ?? '')),
    accent: accent as 'navy',
    sort_order: Number(formData.get('sortOrder') ?? 0) || 0,
    is_published: String(formData.get('isPublished') ?? '') === 'on',
    updated_by: claimsData?.claims?.sub ? String(claimsData.claims.sub) : null,
  }).eq('id', id)

  if (error) redirect(back('error', error.message, pageSlug))
  revalidatePath('/'); revalidatePath('/editor/pages')
  redirect(back('message', 'Item updated.', pageSlug))
}
