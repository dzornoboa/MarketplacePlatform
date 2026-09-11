'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/format'
import type { Database } from '@/lib/database.types'

function back(path: string, key: 'error' | 'message', message: string) {
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(message)}`
}

const CATEGORIES = new Set(['news', 'resource'])

function readPost(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const category = String(formData.get('category') ?? 'news')
  const slug = slugify(String(formData.get('slug') ?? '') || title)
  const excerpt = String(formData.get('excerpt') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const imageUrl = String(formData.get('imageUrl') ?? '').trim()
  const externalUrl = String(formData.get('externalUrl') ?? '').trim()
  return { title, category, slug, excerpt, body, imageUrl, externalUrl }
}

function validate(post: ReturnType<typeof readPost>): string | null {
  if (post.title.length < 3) return 'Title must be at least 3 characters.'
  if (!CATEGORIES.has(post.category)) return 'Choose news or resource.'
  if (!post.slug) return 'A URL slug is required.'
  if (post.body.length < 20) return 'Body must be at least 20 characters.'
  if (post.imageUrl && !(post.imageUrl.startsWith('https://') || post.imageUrl.startsWith('/'))) {
    return 'Image URL must start with https:// or /.'
  }
  return null
}

/* Published articles are readable by anon; drafts are visible only to staff
   holding the content capability. RLS enforces both. */
export async function createPost(formData: FormData) {
  const post = readPost(formData)
  const problem = validate(post)
  if (problem) redirect(back('/editor/news/new', 'error', problem))
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const publish = String(formData.get('intent') ?? '') === 'publish'

  const { data, error } = await supabase.from('content_posts').insert({
    title: post.title, category: post.category, slug: post.slug,
    excerpt: post.excerpt || null, body: post.body,
    image_url: post.imageUrl || null, external_url: post.externalUrl || null,
    status: publish ? 'published' : 'draft',
    published_at: publish ? new Date().toISOString() : null,
    author_id: claimsData?.claims?.sub ? String(claimsData.claims.sub) : null,
  }).select('id').single()

  if (error || !data) redirect(back('/editor/news/new', 'error', error?.message ?? 'Unable to save the article.'))
  revalidatePath('/editor/news'); revalidatePath('/news')
  redirect(back('/editor/news', 'message', publish ? 'Article published.' : 'Draft saved.'))
}

export async function updatePost(formData: FormData) {
  const id = String(formData.get('postId') ?? '')
  const post = readPost(formData)
  const target = `/editor/news/${id}`
  if (!id) redirect(back('/editor/news', 'error', 'Article not found.'))
  const problem = validate(post)
  if (problem) redirect(back(target, 'error', problem))

  const intent = String(formData.get('intent') ?? 'save')
  const supabase = await createClient()
  const patch: Database['public']['Tables']['content_posts']['Update'] = {
    title: post.title, category: post.category, slug: post.slug,
    excerpt: post.excerpt || null, body: post.body,
    image_url: post.imageUrl || null, external_url: post.externalUrl || null,
  }
  if (intent === 'publish') { patch.status = 'published'; patch.published_at = new Date().toISOString() }
  if (intent === 'unpublish') { patch.status = 'draft' }
  if (intent === 'archive') { patch.status = 'archived' }

  const { error } = await supabase.from('content_posts').update(patch).eq('id', id)
  if (error) redirect(back(target, 'error', error.message))
  revalidatePath('/editor/news'); revalidatePath('/news'); revalidatePath(`/news/${post.slug}`)
  redirect(back('/editor/news', 'message', 'Article updated.'))
}

export async function deletePost(formData: FormData) {
  const id = String(formData.get('postId') ?? '')
  if (!id) redirect(back('/editor/news', 'error', 'Article not found.'))
  const supabase = await createClient()
  const { error } = await supabase.from('content_posts').delete().eq('id', id)
  if (error) redirect(back('/editor/news', 'error', error.message))
  revalidatePath('/editor/news'); revalidatePath('/news')
  redirect(back('/editor/news', 'message', 'Article deleted.'))
}
