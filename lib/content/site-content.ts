import { createPublicClient } from '@/lib/supabase/public'
import type { Database, SiteContentBlock, SiteContentItem } from '@/lib/database.types'

export type Accent = Database['public']['Enums']['brand_accent']

export type ContentItem = Pick<SiteContentItem, 'item_key' | 'eyebrow' | 'heading' | 'body' | 'accent' | 'image_url' | 'image_alt' | 'href'>

export type ContentSection = Pick<SiteContentBlock,
  'section_key' | 'layout' | 'accent' | 'eyebrow' | 'heading' | 'heading_emphasis' | 'body' |
  'cta_label' | 'cta_href' | 'secondary_cta_label' | 'secondary_cta_href' | 'image_url'> & { items: ContentItem[] }

export type HomeContent = Record<string, ContentSection | undefined>

const section = (
  section_key: string,
  layout: string,
  accent: Accent,
  rest: Partial<Omit<ContentSection, 'section_key' | 'layout' | 'accent' | 'items'>> & { items?: ContentItem[] },
): ContentSection => ({
  section_key, layout, accent,
  eyebrow: rest.eyebrow ?? null,
  heading: rest.heading ?? '',
  heading_emphasis: rest.heading_emphasis ?? null,
  body: rest.body ?? null,
  cta_label: rest.cta_label ?? null,
  cta_href: rest.cta_href ?? null,
  secondary_cta_label: rest.secondary_cta_label ?? null,
  secondary_cta_href: rest.secondary_cta_href ?? null,
  image_url: rest.image_url ?? null,
  items: rest.items ?? [],
})

const item = (item_key: string, heading: string, rest: Partial<Omit<ContentItem, 'item_key' | 'heading'>> = {}): ContentItem => ({
  item_key, heading,
  eyebrow: rest.eyebrow ?? null,
  body: rest.body ?? null,
  accent: rest.accent ?? 'navy',
  image_url: rest.image_url ?? null,
  image_alt: rest.image_alt ?? null,
  href: rest.href ?? null,
})

/* Mirrors the seed in the `seed_home_content_for_brand_redesign` migration.
   The page renders this whenever Supabase is unreachable or returns nothing,
   so the public site never degrades to an empty shell. */
export const HOME_FALLBACK: HomeContent = {
  hero: section('hero', 'hero', 'navy', {
    eyebrow: 'World Trade Centre Accra',
    heading: 'Where the world does',
    heading_emphasis: 'business',
    body: 'Connect with credible buyers, investors, businesses and WTC members through a professionally managed trade and investment network — verified before it is opened.',
    cta_label: 'Join the network', cta_href: '/register',
    secondary_cta_label: 'Member sign in', secondary_cta_href: '/login',
  }),
  hero_card: section('hero_card', 'hero_card', 'navy', {
    eyebrow: 'Private marketplace',
    heading: 'Opportunities stay protected.',
    body: 'The public website explains the network. Actual investment and trade opportunities become visible only after authentication and WTC Accra verification.',
    items: [
      item('identity', 'Identity'),
      item('verification', 'Verification', { accent: 'orange' }),
      item('access', 'Access control', { accent: 'teal' }),
    ],
  }),
  about: section('about', 'feature_grid', 'navy', {
    eyebrow: 'Built for trusted trade',
    heading: 'A business platform with',
    heading_emphasis: 'verification at its core',
    body: 'The WTCA is a worldwide network of business centres, professionals and organisations across all industries, supporting one another for the betterment of global commerce. WTC Accra brings that network to Ghana.',
    items: [
      item('verified-participants', 'Verified participants', { body: 'Buyers, investors, businesses and WTC members use one common dashboard, with privileges assigned only after review.' }),
      item('protected-opportunities', 'Protected opportunities', { body: 'No public deal catalogue. Opportunity records, documents and matching tools sit behind verified access.', accent: 'orange' }),
      item('wtc-oversight', 'WTC Accra oversight', { body: 'Administrators review membership claims, participant type and verification status before enabling private functions.', accent: 'teal' }),
    ],
  }),
  about_media: section('about_media', 'media_row', 'navy', {
    heading: 'Our business, our communities, our values',
    items: [
      item('accra-market', 'Accra investment and trade activity', { image_url: '/images/accra-investment-market-hero.webp', image_alt: 'Accra investment and trade activity' }),
      item('africa-network', 'Regional trade network across Africa', { image_url: '/images/africa-trade-network.webp', image_alt: 'Regional trade network across Africa', accent: 'orange' }),
      item('deal-review', 'Members reviewing a transaction', { image_url: '/images/deal-review-boardroom.webp', image_alt: 'Members reviewing a transaction', accent: 'teal' }),
    ],
  }),
  'how-it-works': section('how-it-works', 'steps', 'orange', {
    eyebrow: 'How it works',
    heading: 'Three steps to',
    heading_emphasis: 'verified access',
    items: [
      item('create-account', 'Create an account', { eyebrow: '01', body: 'Choose your participant category and confirm your email address.', accent: 'orange' }),
      item('complete-verification', 'Complete verification', { eyebrow: '02', body: 'Fill in your profile and submit it to WTC Accra for review.', accent: 'teal' }),
      item('access-network', 'Access the network', { eyebrow: '03', body: 'Verified members unlock curated opportunities, matching and future deal-room services.' }),
    ],
  }),
  value: section('value', 'value_grid', 'orange', {
    eyebrow: 'What membership delivers',
    heading: 'A world of',
    heading_emphasis: 'opportunity',
    body: 'There’s a world of opportunity out there. Can you afford not to connect with it? Six reasons members join the World Trade Centers Association network.',
    items: [
      item('connection', 'Connection', { body: 'A connected network and tools that create new business relationships and increase reach across industries and locations.', accent: 'orange' }),
      item('marquee-standing', 'Marquee standing', { body: 'A prestigious trademark that brings authoritative name recognition and an instantly distinguished reputation.', accent: 'orange' }),
      item('credibility', 'Credibility', { body: 'Membership in a prominent and notable association raises the profile of your organisation and differentiates your brand.', accent: 'orange' }),
      item('business-opportunity', 'Business opportunity', { body: 'Access to contacts and services opens the door for new collaboration, information and chances to grow.', accent: 'orange' }),
      item('neutral-positioning', 'Neutral positioning', { body: 'A non-political association that supports organisations regardless of political affiliation or intergovernmental activity.', accent: 'orange' }),
      item('trade-facilitation', 'Trade facilitation', { body: 'Consulting, thought leadership, training and trade services drawn from the wider WTCA member community.', accent: 'orange' }),
    ],
  }),
  membership: section('membership', 'cta', 'navy', {
    eyebrow: 'Membership access',
    heading: 'Start with your',
    heading_emphasis: 'verified WTC Accra profile',
    body: 'Registration is open to all; private marketplace access is controlled by WTC Accra.',
    cta_label: 'Create account', cta_href: '/register',
    secondary_cta_label: 'Member sign in', secondary_cta_href: '/login',
  }),
  contact: section('contact', 'contact', 'navy', {
    eyebrow: 'Contact',
    heading: 'Need help',
    heading_emphasis: 'joining the platform?',
    body: 'Contact World Trade Centre Accra for membership, verification and platform support. Existing members can raise a request from the support area of the member dashboard.',
    cta_label: 'Create your account', cta_href: '/register',
  }),
}

const BLOCK_COLUMNS = 'id,section_key,layout,accent,eyebrow,heading,heading_emphasis,body,cta_label,cta_href,secondary_cta_label,secondary_cta_href,image_url'
const ITEM_COLUMNS = 'block_id,item_key,eyebrow,heading,body,accent,image_url,image_alt,href'

/* Blocks and items are fetched separately rather than as a PostgREST embed:
   two trivial queries keep the result fully typed and avoid relying on the
   hand-maintained Relationships metadata in database.types.ts. */
export async function getHomeContent(): Promise<HomeContent> {
  try {
    const supabase = createPublicClient()
    const { data: blocks, error } = await supabase
      .from('site_content_blocks')
      .select(BLOCK_COLUMNS)
      .eq('page_slug', 'home')
      .eq('is_published', true)
      .order('sort_order')
    if (error || !blocks?.length) return HOME_FALLBACK

    const { data: items } = await supabase
      .from('site_content_items')
      .select(ITEM_COLUMNS)
      .in('block_id', blocks.map(block => block.id))
      .eq('is_published', true)
      .order('sort_order')

    const content: HomeContent = {}
    for (const block of blocks) {
      const { id, ...rest } = block
      content[block.section_key] = {
        ...rest,
        items: (items ?? []).filter(row => row.block_id === id).map(({ block_id: _block_id, ...entry }) => entry),
      }
    }
    // A partial response should not blank out sections the design expects.
    return { ...HOME_FALLBACK, ...content }
  } catch {
    return HOME_FALLBACK
  }
}

/* ---- Public chrome: header nav, footer columns and global strings -------- */

export type NavLink = { label: string; href: string }
export type SiteChrome = { header: NavLink[]; footerPlatform: NavLink[]; settings: Record<string, string> }

export const CHROME_FALLBACK: SiteChrome = {
  header: [
    { label: 'About', href: '/#about' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Why WTC Accra', href: '/#value' },
    { label: 'Membership', href: '/#membership' },
    { label: 'News', href: '/news' },
    { label: 'Contact', href: '/#contact' },
  ],
  footerPlatform: [
    { label: 'About', href: '/#about' },
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Membership', href: '/#membership' },
    { label: 'News and resources', href: '/news' },
    { label: 'Member sign in', href: '/login' },
  ],
  settings: {
    site_tagline: 'Connecting Businesses, Globally.',
    footer_intro: 'A trusted digital gateway connecting Ghanaian businesses, buyers and investors to the worldwide World Trade Centers Association network.',
    footer_access: 'Private opportunities are available only to authenticated and WTC Accra-verified users. The public site explains the network; it never lists deals.',
    footer_copyright: '© 2026 World Trade Centre Accra. All rights reserved.',
    contact_email: 'membership@wtcaccra.com',
    contact_phone: '',
    contact_address: 'World Trade Centre Accra, Ghana',
  },
}

export async function getSiteChrome(): Promise<SiteChrome> {
  try {
    const supabase = createPublicClient()
    const [{ data: links, error: linkError }, { data: settings }] = await Promise.all([
      supabase.from('site_nav_links').select('placement,label,href,sort_order').eq('is_published', true).order('sort_order'),
      supabase.from('site_settings').select('key,value'),
    ])
    if (linkError || !links?.length) return CHROME_FALLBACK
    const pick = (placement: string) => links.filter(l => l.placement === placement).map(l => ({ label: l.label, href: l.href }))
    const header = pick('header')
    const footerPlatform = pick('footer_platform')
    return {
      header: header.length ? header : CHROME_FALLBACK.header,
      footerPlatform: footerPlatform.length ? footerPlatform : CHROME_FALLBACK.footerPlatform,
      settings: { ...CHROME_FALLBACK.settings, ...Object.fromEntries((settings ?? []).map(s => [s.key, s.value])) },
    }
  } catch {
    return CHROME_FALLBACK
  }
}

/* ---- Standalone public pages -------------------------------------------- */

export type PageContent = { slug: string; sections: ContentSection[] }

/* Ordered sections for one public page. Returns an empty list rather than
   throwing, so a page renders its own not-found state instead of a 500. */
export async function getPageContent(slug: string): Promise<PageContent> {
  try {
    const supabase = createPublicClient()
    const { data: blocks, error } = await supabase
      .from('site_content_blocks')
      .select(BLOCK_COLUMNS)
      .eq('page_slug', slug)
      .eq('is_published', true)
      .order('sort_order')
    if (error || !blocks?.length) return { slug, sections: [] }

    const { data: items } = await supabase
      .from('site_content_items')
      .select(ITEM_COLUMNS)
      .in('block_id', blocks.map(block => block.id))
      .eq('is_published', true)
      .order('sort_order')

    return {
      slug,
      sections: blocks.map(block => {
        const { id, ...rest } = block
        return {
          ...rest,
          items: (items ?? []).filter(row => row.block_id === id).map(({ block_id: _b, ...entry }) => entry),
        }
      }),
    }
  } catch {
    return { slug, sections: [] }
  }
}

export type PlanSummary = {
  code: string; name: string; description: string | null
  price_usd: number; billing_interval: string; target_participant_types: string[]
}

/* Used by the `plans` layout on the membership page so pricing is never
   duplicated between the marketing site and the billing screen. */
export async function getPublicPlans(): Promise<PlanSummary[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase.from('subscription_plans')
      .select('code,name,description,price_usd,billing_interval,target_participant_types')
      .eq('active', true).order('price_usd')
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

/* One editable block (eyebrow / heading / emphasis / body / buttons) for
   pages that are otherwise code-driven: news index, live listings, the
   sign-in and register asides. Falls back to the copy given. */
export async function getPageBlock(slug: string, key: string, fallback: Omit<ContentSection, 'items' | 'section_key' | 'layout' | 'accent'> & Partial<Pick<ContentSection, 'accent'>>): Promise<ContentSection> {
  const page = await getPageContent(slug)
  const found = page.sections.find(b => b.section_key === key)
  return found ?? { section_key: key, layout: 'page_head', accent: fallback.accent ?? 'navy', items: [], ...fallback }
}
