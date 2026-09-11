import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { BrandCircle } from '@/components/brand'
import { createPublicClient } from '@/lib/supabase/public'
import { date } from '@/lib/format'

export const revalidate = 300

export const metadata = {
  title: 'News and resources',
  description: 'Trade and investment news, guidance and resources from World Trade Centre Accra.',
}

export default async function NewsIndexPage() {
  const supabase = createPublicClient()
  const { data: posts } = await supabase.from('content_posts')
    .select('id,title,slug,excerpt,category,image_url,published_at')
    .eq('status', 'published').order('published_at', { ascending: false }).limit(60)

  const news = (posts ?? []).filter(p => p.category === 'news')
  const resources = (posts ?? []).filter(p => p.category === 'resource')

  return <><PublicHeader /><main>
    <section className="section">
      <div className="section-head">
        <p className="eyebrow">News and resources</p>
        <h2>Commerce and <strong>connections</strong></h2>
        <p className="lede">Trade and investment news, guidance and practical resources from World Trade Centre Accra and the wider WTCA network.</p>
      </div>

      {(posts ?? []).length === 0
        ? <section className="card empty-state"><BrandCircle /><h2>Nothing published yet</h2><p>New articles will appear here.</p></section>
        : <>
            {news.length > 0 && <div className="article-grid">{news.map(post => <ArticleCard key={post.id} post={post} />)}</div>}
            {resources.length > 0 && <>
              <div className="section-head section-head-inline"><h2>Resources</h2></div>
              <div className="article-grid">{resources.map(post => <ArticleCard key={post.id} post={post} />)}</div>
            </>}
          </>}
    </section>
  </main><PublicFooter /></>
}

type CardPost = { id: string; title: string; slug: string; excerpt: string | null; category: string; image_url: string | null; published_at: string | null }

function ArticleCard({ post }: { post: CardPost }) {
  return <article className="card article-card">
    {post.image_url && <img className="article-image" src={post.image_url} alt="" />}
    <span className="eyebrow">{post.category === 'resource' ? 'Resource' : 'News'}</span>
    <h3><Link href={`/news/${post.slug}`}>{post.title}</Link></h3>
    {post.excerpt && <p className="muted">{post.excerpt}</p>}
    <p className="field-help">{date(post.published_at)}</p>
    <Link className="arrow-link" href={`/news/${post.slug}`}>Read →</Link>
  </article>
}
