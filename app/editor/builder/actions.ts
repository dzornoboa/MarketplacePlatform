'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { SiteContentBlock, SiteContentItem } from '@/lib/database.types'

/* JSON-returning actions for the visual site builder. Each one re-checks
   the content capability through RLS (the policies on site_content_* only
   let content managers write) and revalidates the public page afterwards. */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string }

const ACCENTS = new Set(['navy', 'orange', 'teal', 'gold', 'sky', 'peach'])
const PAGE_PATHS: Record<string, string> = { home: '/', about: '/about', 'how-it-works': '/how-it-works', membership: '/membership', contact: '/contact', 'why-wtc-accra': '/why-wtc-accra', news: '/news', listings: '/opportunities', auth: '/register' }

function clean(v: unknown): string | null { const s = String(v ?? '').trim(); return s ? s : null }
function goodLink(v: string | null) { return !v || v.startsWith('https://') || v.startsWith('/') || v.startsWith('#') || v.startsWith('mailto:') || v.startsWith('tel:') }
function goodImage(v: string | null) { return !v || v.startsWith('https://') || v.startsWith('/') }

function revalidate(pageSlug: string) {
  revalidatePath(PAGE_PATHS[pageSlug] ?? `/${pageSlug}`); if (pageSlug === 'auth') revalidatePath('/login'); revalidatePath('/'); revalidatePath('/editor/builder'); revalidatePath('/editor/pages')
}

async function who() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return { supabase, userId: data?.claims?.sub ? String(data.claims.sub) : null }
}

export async function saveBlock(input: Partial<SiteContentBlock> & { id: string; page_slug: string }): Promise<Result> {
  const heading = String(input.heading ?? '').trim()
  if (heading.length < 2 || heading.length > 240) return { ok: false, error: 'Heading must be between 2 and 240 characters.' }
  const accent = String(input.accent ?? 'navy')
  if (!ACCENTS.has(accent)) return { ok: false, error: 'Choose a brand accent colour.' }
  const cta = clean(input.cta_href), cta2 = clean(input.secondary_cta_href), image = clean(input.image_url)
  if (!goodLink(cta) || !goodLink(cta2)) return { ok: false, error: 'Links must start with https://, /, #, mailto: or tel:.' }
  if (!goodImage(image)) return { ok: false, error: 'Image URL must start with https:// or /.' }
  const { supabase, userId } = await who()
  const { error } = await supabase.from('site_content_blocks').update({
    eyebrow: clean(input.eyebrow), heading, heading_emphasis: clean(input.heading_emphasis), body: clean(input.body),
    cta_label: clean(input.cta_label), cta_href: cta, secondary_cta_label: clean(input.secondary_cta_label), secondary_cta_href: cta2,
    image_url: image, accent: accent as 'navy', is_published: input.is_published !== false, updated_by: userId,
  }).eq('id', input.id)
  if (error) return { ok: false, error: error.message }
  revalidate(input.page_slug)
  return { ok: true }
}

export async function saveItem(input: Partial<SiteContentItem> & { id: string; page_slug: string }): Promise<Result> {
  const heading = String(input.heading ?? '').trim()
  if (!heading) return { ok: false, error: 'Item heading is required.' }
  const accent = String(input.accent ?? 'navy')
  if (!ACCENTS.has(accent)) return { ok: false, error: 'Choose a brand accent colour.' }
  const image = clean(input.image_url), href = clean(input.href)
  if (!goodImage(image)) return { ok: false, error: 'Image URL must start with https:// or /.' }
  if (!goodLink(href)) return { ok: false, error: 'Link must start with https://, /, # or mailto:.' }
  const { supabase, userId } = await who()
  const { error } = await supabase.from('site_content_items').update({
    eyebrow: clean(input.eyebrow), heading, body: clean(input.body), accent: accent as 'navy',
    image_url: image, image_alt: clean(input.image_alt), href, is_published: input.is_published !== false, updated_by: userId,
  }).eq('id', input.id)
  if (error) return { ok: false, error: error.message }
  revalidate(input.page_slug)
  return { ok: true }
}

export async function addItem(blockId: string, pageSlug: string): Promise<Result<SiteContentItem>> {
  const { supabase, userId } = await who()
  const { data: existing } = await supabase.from('site_content_items').select('sort_order').eq('block_id', blockId).order('sort_order', { ascending: false }).limit(1)
  const next = (existing?.[0]?.sort_order ?? 0) + 1
  const { data, error } = await supabase.from('site_content_items').insert({
    block_id: blockId, item_key: `item-${Date.now().toString(36)}`, sort_order: next, heading: 'New item', body: 'Describe this item.', accent: 'navy', is_published: true, updated_by: userId,
  }).select('*').single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Could not add the item.' }
  revalidate(pageSlug)
  return { ok: true, data }
}

export async function deleteItem(itemId: string, pageSlug: string): Promise<Result> {
  const { supabase } = await who()
  const { error } = await supabase.from('site_content_items').delete().eq('id', itemId)
  if (error) return { ok: false, error: error.message }
  revalidate(pageSlug)
  return { ok: true }
}

/* Swaps sort_order with the neighbour so sections (or items) reorder. */
export async function reorder(table: 'site_content_blocks' | 'site_content_items', id: string, direction: 'up' | 'down', pageSlug: string): Promise<Result> {
  const { supabase } = await who()
  const { data: row } = await supabase.from(table).select('*').eq('id', id).maybeSingle()
  if (!row) return { ok: false, error: 'Row not found.' }
  const siblings = table === 'site_content_blocks'
    ? supabase.from('site_content_blocks').select('id,sort_order').eq('page_slug', (row as SiteContentBlock).page_slug)
    : supabase.from('site_content_items').select('id,sort_order').eq('block_id', (row as SiteContentItem).block_id)
  const { data: all } = await siblings.order('sort_order')
  const list = all ?? []
  const idx = list.findIndex(r => r.id === id)
  const swap = direction === 'up' ? idx - 1 : idx + 1
  if (idx < 0 || swap < 0 || swap >= list.length) return { ok: true }
  const a = list[idx], b = list[swap]
  const orderA = a.sort_order === b.sort_order ? b.sort_order + (direction === 'up' ? -1 : 1) : b.sort_order
  const r1 = await supabase.from(table).update({ sort_order: orderA }).eq('id', a.id)
  const r2 = await supabase.from(table).update({ sort_order: a.sort_order }).eq('id', b.id)
  if (r1.error || r2.error) return { ok: false, error: (r1.error ?? r2.error)!.message }
  revalidate(pageSlug)
  return { ok: true }
}

export async function setVisibility(table: 'site_content_blocks' | 'site_content_items', id: string, visible: boolean, pageSlug: string): Promise<Result> {
  const { supabase } = await who()
  const { error } = await supabase.from(table).update({ is_published: visible }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidate(pageSlug)
  return { ok: true }
}

/* Uploads an image to the public site-assets bucket and returns its URL. */
export async function uploadSiteImage(formData: FormData): Promise<Result<{ url: string }>> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Choose an image first.' }
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: 'Images must be 8 MB or smaller.' }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type)) return { ok: false, error: 'Use a JPG, PNG, WebP, GIF or SVG.' }
  const { supabase } = await who()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${new Date().getFullYear()}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { error } = await supabase.storage.from('site-assets').upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { ok: false, error: error.message }
  const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
  return { ok: true, data: { url: data.publicUrl } }
}

export async function saveSetting(key: string, value: string): Promise<Result> {
  const { supabase, userId } = await who()
  const { error } = await supabase.from('site_settings').update({ value, updated_by: userId }).eq('key', key)
  if (error) return { ok: false, error: error.message }
  revalidateTag('site-chrome', 'max'); revalidatePath('/', 'layout')
  return { ok: true }
}
