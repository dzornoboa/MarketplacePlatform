import { notFound } from 'next/navigation'
import { requireCapability } from '@/lib/auth/guards'
import { updatePost } from '../actions'
import { PostForm } from '../post-form'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EditPostPage({ params, searchParams }: Props) {
  const { supabase } = await requireCapability('content')
  const { id } = await params
  const search = await searchParams
  const error = typeof search.error === 'string' ? search.error : null

  const { data: post } = await supabase.from('content_posts').select('*').eq('id', id).maybeSingle()
  if (!post) notFound()

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Edit article</p>
      <h1>{post.title}</h1>
      <p className="muted">{humanize(post.category)} · {humanize(post.status)} · last updated {dateTime(post.updated_at)}</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    <PostForm post={post} action={updatePost} />
  </div>
}
