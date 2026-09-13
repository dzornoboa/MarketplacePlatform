import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { dateTime } from '@/lib/format'
import { humanize } from '@/lib/auth/access'

export const dynamic = 'force-dynamic'

export default async function EditorOverviewPage() {
  const { supabase } = await requireCapability('content')

  const [{ count: drafts }, { count: published }, { count: blocks }, { count: items }, { data: recent }] = await Promise.all([
    supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('content_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('site_content_blocks').select('*', { count: 'exact', head: true }),
    supabase.from('site_content_items').select('*', { count: 'exact', head: true }),
    supabase.from('content_posts').select('*').order('updated_at', { ascending: false }).limit(5),
  ])

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Editor console</p>
      <h1>Public website and content</h1>
      <p className="muted">Everything the public sees is stored in the database and edited here. No code change is needed to update the marketing site.</p>
    </div>

    <p><Link className="button button-primary" href="/editor/builder">Open the website builder — edit the live site visually →</Link></p>
    <section className="dashboard-grid">
      <article className="metric-card">
        <span>Draft articles</span><strong>{drafts ?? 0}</strong>
        <p>News and resources not yet visible to the public.</p>
        <Link href="/editor/news">Open news →</Link>
      </article>
      <article className="metric-card">
        <span>Published articles</span><strong>{published ?? 0}</strong>
        <p>Live on the public website.</p>
        <Link href="/news">View public news →</Link>
      </article>
      <article className="metric-card">
        <span>Website sections</span><strong>{(blocks ?? 0)} · {(items ?? 0)}</strong>
        <p>Sections and the items inside them, across all public pages.</p>
        <Link href="/editor/pages">Edit the website →</Link>
      </article>
    </section>

    <section className="card">
      <h2>What you control</h2>
      <ol className="checklist">
        <li><span aria-hidden="true">1</span><span>Home page sections — headline lockups, body copy, buttons, feature cards, steps and value propositions.</span><em>Public website</em></li>
        <li><span aria-hidden="true">2</span><span>News and resource articles, including publishing and unpublishing.</span><em>News and resources</em></li>
        <li><span aria-hidden="true">3</span><span>Section accent colours, drawn from the WTCA brand palette.</span><em>Public website</em></li>
      </ol>
      <p className="field-help">Changes appear on the public site within five minutes, or immediately on the next deploy.</p>
    </section>

    {(recent ?? []).length > 0 && <section className="card">
      <h2>Recently edited articles</h2>
      <div className="history-list">{(recent ?? []).map(post => <div key={post.id}>
        <strong>{post.title}</strong>
        <span>{dateTime(post.updated_at)}</span>
        <p className="muted">{humanize(post.category)} · {humanize(post.status)}</p>
      </div>)}</div>
    </section>}
  </div>
}
