import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { getSiteUrl } from '@/lib/supabase/config'
import { query } from '@/lib/data/timeout'

export const revalidate = 3600

const PAGES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/membership', priority: 0.9 },
  { path: '/opportunities', priority: 0.9 },
  { path: '/about', priority: 0.7 },
  { path: '/how-it-works', priority: 0.7 },
  { path: '/why-wtc-accra', priority: 0.7 },
  { path: '/news', priority: 0.7 },
  { path: '/contact', priority: 0.6 },
  { path: '/register', priority: 0.6 },
  { path: '/login', priority: 0.3 },
  { path: '/privacy', priority: 0.3 },
  { path: '/terms', priority: 0.3 },
]

/* /sitemap.xml answered 404. The published articles are included so new
   writing is found without waiting to be crawled by chance. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl()
  const now = new Date()

  const supabase = createPublicClient()
  const { data: posts } = await query(
    supabase.from('content_posts').select('slug,published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(500),
    'sitemap articles',
  )

  return [
    ...PAGES.map(page => ({
      url: `${site}${page.path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: page.priority,
    })),
    ...(posts ?? []).map(post => ({
      url: `${site}/news/${post.slug}`,
      lastModified: post.published_at ? new Date(post.published_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
