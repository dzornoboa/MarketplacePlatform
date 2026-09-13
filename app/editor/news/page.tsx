import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { deletePost } from './actions'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['news', 'resource'] as const

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditorNewsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('content')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' ? params.status : ''
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const category = typeof params.category === 'string' ? params.category : ''
  const sort = typeof params.sort === 'string' && ['updated', 'newest', 'oldest', 'title'].includes(params.sort) ? params.sort : 'updated'

  let query = supabase.from('content_posts').select('*').limit(200)
  if (status) query = query.eq('status', status as 'draft')
  if (category) query = query.eq('category', category)
  if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
  query = sort === 'title' ? query.order('title')
    : sort === 'updated' ? query.order('updated_at', { ascending: false })
    : query.order('created_at', { ascending: sort === 'oldest' })
  const { data: posts } = await query
  const keep = (extra: string) => `/editor/news?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(sort !== 'updated' && { sort }), ...(extra && { status: extra }) }).toString()}`

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Content</p>
      <h1>News and resources</h1>
      <p className="muted">Articles published here appear on the public website immediately after publishing.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="listing-head card">
      <nav className="queue-tabs">
        {['', 'draft', 'published', 'archived'].map(s => <a key={s || 'all'} className={s === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={keep(s)}>{s ? humanize(s) : 'All'}</a>)}
      </nav>
      <Link className="button button-primary" href="/editor/news/new">New article</Link>
    </section>

    <form className="filter-row card" method="get">
      {status && <input type="hidden" name="status" value={status} />}
      <label>Search<input name="q" defaultValue={q} placeholder="Title or slug" /></label>
      <label>Category
        <select name="category" defaultValue={category}>
          <option value="">All</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{humanize(c)}</option>)}
        </select>
      </label>
      <label>Sort
        <select name="sort" defaultValue={sort}>
          <option value="updated">Recently updated</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option>
        </select>
      </label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {(posts ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>{q || category ? 'No matches' : 'No articles yet'}</h2><p>{q || category ? 'Try a different search or category.' : 'Write the first news item or resource for the public website.'}</p></section>
      : <div className="review-list">{(posts ?? []).map(post => <article className="card review-card" key={post.id}>
          <div className="review-head">
            <div>
              <h2>{post.title}</h2>
              <p>{humanize(post.category)} · /news/{post.slug} · updated {dateTime(post.updated_at)}</p>
            </div>
            <span className={`status-dot status-content-${post.status}`}>{humanize(post.status)}</span>
          </div>
          {post.excerpt && <p className="muted">{post.excerpt}</p>}
          <div className="button-row">
            <Link className="button button-secondary" href={`/editor/news/${post.id}`}>Edit</Link>
            {post.status === 'published' && <Link className="button button-outline" href={`/news/${post.slug}`}>View public page</Link>}
            <form action={deletePost}>
              <input type="hidden" name="postId" value={post.id} />
              <button className="button button-danger" type="submit">Delete</button>
            </form>
          </div>
        </article>)}</div>}
  </div>
}
