import Link from 'next/link'
import type { ContentPost } from '@/lib/database.types'

/* Shared by the create and edit screens. `intent` on the submit button tells the
   action whether to save a draft, publish, unpublish or archive. */
export function PostForm({ post, action }: { post?: ContentPost; action: (formData: FormData) => Promise<void> }) {
  return <form action={action} className="card form-stack">
    {post && <input type="hidden" name="postId" value={post.id} />}
    <label>Title<input name="title" defaultValue={post?.title ?? ''} minLength={3} maxLength={180} required /></label>
    <div className="form-grid">
      <label>Category
        <select name="category" defaultValue={post?.category ?? 'news'} required>
          <option value="news">News</option>
          <option value="resource">Resource</option>
        </select>
      </label>
      <label>URL slug<input name="slug" defaultValue={post?.slug ?? ''} placeholder="Generated from the title if left blank" /></label>
    </div>
    <label>Excerpt<textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ''} placeholder="One or two sentences shown in listings." /></label>
    <label>Body<textarea name="body" rows={16} defaultValue={post?.body ?? ''} minLength={20} required placeholder="Write the full article. Blank lines separate paragraphs." /></label>
    <div className="form-grid">
      <label>Image URL<input name="imageUrl" defaultValue={post?.image_url ?? ''} placeholder="/images/example.webp or https://…" /></label>
      <label>External link<input name="externalUrl" defaultValue={post?.external_url ?? ''} placeholder="https://… (optional)" /></label>
    </div>
    <p className="field-help">Images must be an https:// URL or a path beginning with / inside this site.</p>
    <div className="button-row">
      <button className="button button-secondary" name="intent" value="save" type="submit">{post ? 'Save changes' : 'Save draft'}</button>
      {(!post || post.status !== 'published') && <button className="button button-primary" name="intent" value="publish" type="submit">Publish</button>}
      {post?.status === 'published' && <button className="button button-outline" name="intent" value="unpublish" type="submit">Unpublish</button>}
      {post && post.status !== 'archived' && <button className="button button-outline" name="intent" value="archive" type="submit">Archive</button>}
      <Link className="button button-outline" href="/editor/news">Cancel</Link>
    </div>
  </form>
}
