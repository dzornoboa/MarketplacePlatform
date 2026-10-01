import { getSupabasePublicConfig } from '@/lib/supabase/config'

/* Editors used to paste image addresses from other websites into articles and
   page blocks. Those never render: the Content-Security-Policy only allows
   images from this site and from Supabase storage, and hotlinked thumbnails
   expire anyway — the reader just sees a broken-image icon.

   Everything written through the editor's upload button lands in the
   site-assets bucket, so an address that is not local and not Supabase storage
   is a leftover hotlink. Hide it rather than render a broken picture. */

export function isUsableImage(url: string | null | undefined): boolean {
  if (!url) return false
  const value = url.trim()
  if (!value) return false
  // A path inside this site.
  if (value.startsWith('/') && !value.startsWith('//')) return true
  let parsed: URL
  try { parsed = new URL(value) } catch { return false }
  if (parsed.protocol !== 'https:') return false
  const { host } = new URL(getSupabasePublicConfig().url)
  return parsed.host === host || parsed.host.endsWith('.supabase.co')
}

/* The address to render, or null when it would only produce a broken image. */
export function displayImage(url: string | null | undefined): string | null {
  return isUsableImage(url) ? (url as string).trim() : null
}
