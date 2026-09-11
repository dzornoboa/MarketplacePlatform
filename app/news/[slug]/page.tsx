import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { createPublicClient } from '@/lib/supabase/public'
import { date } from '@/lib/format'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: post } = await supabase.from('content_posts')
    .select('title,excerpt').eq('slug', slug).eq('status', 'published').maybeSingle()
  if (!post) return { title: 'Article not found' }
  return { title: post.title, description: post.excerpt ?? undefined }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: post } = await supabase.from('content_posts')
    .select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  if (!post) notFound()

  const paragraphs = post.body.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)

  return <><PublicHeader /><main>
    <article className="section article-page">
      <p className="eyebrow">{post.category === 'resource' ? 'Resource' : 'News'}</p>
      <h1 className="article-title">{post.title}</h1>
      <p className="field-help">{date(post.published_at)}</p>
      {post.image_url && <img className="article-hero" src={post.image_url} alt="" />}
      {post.excerpt && <p className="lede">{post.excerpt}</p>}
      <div className="prose">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {post.external_url && <p><a className="arrow-link" href={post.external_url} rel="noopener noreferrer" target="_blank">Read the full source →</a></p>}
      <p><Link className="arrow-link" href="/news">← All news and resources</Link></p>
    </article>
  </main><PublicFooter /></>
}
