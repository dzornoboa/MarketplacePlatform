import { requireCapability } from '@/lib/auth/guards'
import { createPost } from '../actions'
import { PostForm } from '../post-form'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function NewPostPage({ searchParams }: Props) {
  await requireCapability('content')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">New article</p>
      <h1>Write a news item or resource</h1>
      <p className="muted">Save a draft to keep working, or publish to put it on the public website.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    <PostForm action={createPost} />
  </div>
}
