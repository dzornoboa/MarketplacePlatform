import { requireCapability } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { dateTime } from '@/lib/format'
import { updateBlock, updateItem } from './actions'

export const dynamic = 'force-dynamic'

const ACCENTS = ['navy', 'orange', 'teal', 'gold', 'sky', 'peach'] as const
const PAGES = ['home', 'about', 'how-it-works', 'membership', 'contact'] as const

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditorPagesPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('content')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const pageSlug = typeof params.page === 'string' && PAGES.includes(params.page as 'home') ? params.page : 'home'

  const { data: blocks } = await supabase.from('site_content_blocks').select('*')
    .eq('page_slug', pageSlug).order('sort_order')
  const blockIds = (blocks ?? []).map(b => b.id)
  const { data: items } = blockIds.length
    ? await supabase.from('site_content_items').select('*').in('block_id', blockIds).order('sort_order')
    : { data: [] }

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Public website</p>
      <h1>Edit page sections</h1>
      <p className="muted">Every headline, paragraph, button and card on the public site is a row here. The light half of a headline is the “heading”; the bold navy half is the “emphasis”.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <nav className="queue-tabs">
      {PAGES.map(p => <a key={p} className={p === pageSlug ? 'queue-tab queue-tab-active' : 'queue-tab'} href={`/editor/pages?page=${p}`}>{humanize(p)}</a>)}
    </nav>

    {(blocks ?? []).length === 0
      ? <section className="card empty-state"><h2>No sections for this page</h2><p>The “{humanize(pageSlug)}” page has no content rows yet.</p></section>
      : (blocks ?? []).map(block => {
          const blockItems = (items ?? []).filter(i => i.block_id === block.id)
          return <section className="card block-editor" key={block.id}>
            <div className="review-head">
              <div>
                <h2>{humanize(block.section_key)}</h2>
                <p>Layout: {humanize(block.layout)} · position {block.sort_order} · updated {dateTime(block.updated_at)}</p>
              </div>
              <span className={block.is_published ? 'status-dot status-verified' : 'status-dot'}>{block.is_published ? 'Published' : 'Hidden'}</span>
            </div>

            <form action={updateBlock} className="form-stack">
              <input type="hidden" name="blockId" value={block.id} />
              <input type="hidden" name="pageSlug" value={pageSlug} />
              <div className="form-grid">
                <label>Eyebrow<input name="eyebrow" defaultValue={block.eyebrow ?? ''} placeholder="Small uppercase label" /></label>
                <label>Accent colour
                  <select name="accent" defaultValue={block.accent}>
                    {ACCENTS.map(a => <option key={a} value={a}>{humanize(a)}</option>)}
                  </select>
                </label>
              </div>
              <div className="form-grid">
                <label>Heading (light)<input name="heading" defaultValue={block.heading} required /></label>
                <label>Emphasis (bold navy)<input name="headingEmphasis" defaultValue={block.heading_emphasis ?? ''} /></label>
              </div>
              <label>Body<textarea name="body" rows={3} defaultValue={block.body ?? ''} /></label>
              <div className="form-grid">
                <label>Primary button label<input name="ctaLabel" defaultValue={block.cta_label ?? ''} /></label>
                <label>Primary button link<input name="ctaHref" defaultValue={block.cta_href ?? ''} placeholder="/register" /></label>
              </div>
              <div className="form-grid">
                <label>Secondary button label<input name="secondaryCtaLabel" defaultValue={block.secondary_cta_label ?? ''} /></label>
                <label>Secondary button link<input name="secondaryCtaHref" defaultValue={block.secondary_cta_href ?? ''} placeholder="/login" /></label>
              </div>
              <label>Image URL<input name="imageUrl" defaultValue={block.image_url ?? ''} placeholder="/images/example.webp" /></label>
              <label className="switch"><input type="checkbox" name="isPublished" defaultChecked={block.is_published} /> Visible on the public site</label>
              <button className="button button-primary" type="submit">Save section</button>
            </form>

            {blockItems.length > 0 && <div className="item-editor">
              <h3>Items in this section ({blockItems.length})</h3>
              {blockItems.map(item => <form action={updateItem} className="form-stack item-form" key={item.id}>
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="pageSlug" value={pageSlug} />
                <div className="form-grid">
                  <label>Label / number<input name="eyebrow" defaultValue={item.eyebrow ?? ''} placeholder="01" /></label>
                  <label>Order<input name="sortOrder" type="number" defaultValue={item.sort_order} /></label>
                </div>
                <label>Heading<input name="heading" defaultValue={item.heading} required /></label>
                <label>Body<textarea name="body" rows={2} defaultValue={item.body ?? ''} /></label>
                <div className="form-grid">
                  <label>Image URL<input name="imageUrl" defaultValue={item.image_url ?? ''} /></label>
                  <label>Image alt text<input name="imageAlt" defaultValue={item.image_alt ?? ''} /></label>
                </div>
                <div className="form-grid">
                  <label>Accent colour
                    <select name="accent" defaultValue={item.accent}>
                      {ACCENTS.map(a => <option key={a} value={a}>{humanize(a)}</option>)}
                    </select>
                  </label>
                  <label className="switch"><input type="checkbox" name="isPublished" defaultChecked={item.is_published} /> Visible</label>
                </div>
                <button className="button button-secondary" type="submit">Save item</button>
              </form>)}
            </div>}
          </section>
        })}
  </div>
}
