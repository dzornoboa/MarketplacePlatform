import { requireCapability } from '@/lib/auth/guards'
import { SiteBuilder } from '@/components/site-builder'

export const dynamic = 'force-dynamic'

const PAGES = ['home', 'about', 'how-it-works', 'why-wtc-accra', 'membership', 'contact', 'news', 'listings', 'auth']

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* Visual editor for the public website. Loads every section and item of
   the chosen page plus the site settings; the client component does the rest. */
export default async function EditorBuilderPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('content')
  const params = await searchParams
  const pageSlug = typeof params.page === 'string' && PAGES.includes(params.page) ? params.page : 'home'

  const { data: blocks } = await supabase.from('site_content_blocks').select('*').eq('page_slug', pageSlug).order('sort_order')
  const ids = (blocks ?? []).map(b => b.id)
  const [{ data: items }, { data: settings }] = await Promise.all([
    ids.length ? supabase.from('site_content_items').select('*').in('block_id', ids).order('sort_order') : Promise.resolve({ data: [] }),
    supabase.from('site_settings').select('key,value,label,help').order('key'),
  ])

  return <SiteBuilder pageSlug={pageSlug} blocks={blocks ?? []} items={items ?? []} settings={settings ?? []} />
}
