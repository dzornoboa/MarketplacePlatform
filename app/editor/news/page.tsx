import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { deletePost } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditorNewsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('content')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const status = typeof params.status === 'string' ? params.status : ''

  let query = supabase.from('content_posts').select('*').order('updated_at', { ascending: false }).limit(100)
  if (status) query = query.eq('status', status as 'draft')
  const { data: posts } = await query

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
        {['', 'draft', 'published', 'archived'].map(s => <a key={s || 'all'} className={s === status ? 'queue-tab queue-tab-active' : 'queue-tab'} href={s ? `/editor/news?status=${s}` : '/editor/news'}>{s ? humanize(s) : 'All'}</a>)}
      </nav>
      <Link className="button button-primary" href="/editor/news/new">New article</Link>
    </section>

    {(posts ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>No articles yet</h2><p>Write the first news item or resource for the public website.</p></section>
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
