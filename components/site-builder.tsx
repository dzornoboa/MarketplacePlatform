'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { SiteContentBlock, SiteContentItem } from '@/lib/database.types'
import { saveBlock, saveItem, addItem, deleteItem, reorder, setVisibility, uploadSiteImage, saveSetting } from '@/app/editor/builder/actions'

/* Visual site builder, in the spirit of Elementor: the live public page on
   the left, a properties panel on the right. Click a section in the preview
   (or in the outline) to edit its copy, buttons, image and colour; reorder,
   hide or show sections and their cards; upload images. Every save writes
   the same site_content_* rows the public site renders from, then reloads
   the preview. */

type Block = SiteContentBlock
type Item = SiteContentItem
type Setting = { key: string; value: string; label: string; help: string | null }

const ACCENTS = ['navy', 'orange', 'teal', 'gold', 'sky', 'peach'] as const
const PAGES: Array<{ slug: string; label: string; path: string }> = [
  { slug: 'home', label: 'Home', path: '/' },
  { slug: 'about', label: 'About', path: '/about' },
  { slug: 'how-it-works', label: 'How it works', path: '/how-it-works' },
  { slug: 'why-wtc-accra', label: 'Why WTC Accra', path: '/why-wtc-accra' },
  { slug: 'membership', label: 'Membership', path: '/membership' },
  { slug: 'contact', label: 'Contact', path: '/contact' },
  { slug: 'news', label: 'News', path: '/news' },
  { slug: 'listings', label: 'Live listings', path: '/opportunities' },
  { slug: 'auth', label: 'Sign in / Register', path: '/register' },
]
const LAYOUT_HELP: Record<string, string> = {
  hero: 'Large banner at the top of the page. Heading + emphasis, one paragraph, two buttons, optional photo.',
  page_hero: 'Page banner. Heading + emphasis, one paragraph, buttons, optional photo.',
  hero_card: 'White card inside the hero. Items become the small chips.',
  feature_grid: 'Grid of cards. Each item is one card with a title and text.',
  steps: 'Numbered steps. Each item is one step.',
  value_grid: 'Value propositions. Each item is one column.',
  media_row: 'Row of round photos. Each item is one photo (image URL + alt text).',
  leadership: 'Leadership portraits. Each item is one person (heading = name, eyebrow = title, image).',
  faq: 'Questions and answers. Each item: heading = question, body = answer.',
  plans: 'Membership plans pulled from the billing plans; only the heading and text are edited here.',
  cta: 'Full-width call-to-action band with two buttons.',
  contact: 'Contact block. Details come from Site settings.',
  prose: 'Simple text section.',
  page_head: 'Page heading: eyebrow, heading + emphasis, intro text and (where shown) the two buttons.',
}

function pretty(key: string) { return key.replaceAll('_', ' ').replaceAll('-', ' ') }

export function SiteBuilder({ pageSlug, blocks: initialBlocks, items: initialItems, settings }: {
  pageSlug: string; blocks: Block[]; items: Item[]; settings: Setting[]
}) {
  const page = PAGES.find(p => p.slug === pageSlug) ?? PAGES[0]
  const [blocks, setBlocks] = useState(initialBlocks)
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<string | null>(initialBlocks[0]?.id ?? null)
  const [draft, setDraft] = useState<Block | null>(initialBlocks[0] ?? null)
  const [itemDrafts, setItemDrafts] = useState<Record<string, Item>>({})
  const [tab, setTab] = useState<'sections' | 'settings'>('sections')
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [pending, start] = useTransition()
  const frame = useRef<HTMLIFrameElement>(null)
  const [stamp, setStamp] = useState(0)

  useEffect(() => { setBlocks(initialBlocks); setItems(initialItems) }, [initialBlocks, initialItems])

  const block = useMemo(() => blocks.find(b => b.id === selected) ?? null, [blocks, selected])
  const blockItems = useMemo(() => items.filter(i => i.block_id === selected).sort((a, b) => a.sort_order - b.sort_order), [items, selected])

  const select = useCallback((id: string) => {
    setSelected(id)
    const b = blocks.find(x => x.id === id) ?? null
    setDraft(b ? { ...b } : null)
    setItemDrafts({})
    const doc = frame.current?.contentDocument
    const el = b && doc?.querySelector<HTMLElement>(`[data-section="${b.section_key}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [blocks])

  const reload = useCallback(() => setStamp(Date.now()), [])

  /* Same-origin preview: outline sections, select on click. */
  const wire = useCallback(() => {
    const doc = frame.current?.contentDocument
    if (!doc) return
    if (!doc.getElementById('builder-style')) {
      const style = doc.createElement('style'); style.id = 'builder-style'
      style.textContent = `[data-section]{outline:2px dashed transparent;outline-offset:-2px;transition:outline-color .15s;cursor:pointer;position:relative}
[data-section]:hover{outline-color:#E85D0C}
[data-section].builder-selected{outline:3px solid #E85D0C}
[data-section]:hover::before,[data-section].builder-selected::before{content:attr(data-section);position:absolute;top:0;left:0;background:#E85D0C;color:#fff;font:700 11px/1 sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:5px 8px;z-index:50}
a[href]{pointer-events:none}`
      doc.head.appendChild(style)
    }
    doc.querySelectorAll<HTMLElement>('[data-section]').forEach(el => {
      el.onclick = e => { e.preventDefault(); e.stopPropagation(); const b = blocks.find(x => x.section_key === el.dataset.section); if (b) select(b.id) }
      el.classList.toggle('builder-selected', !!block && el.dataset.section === block.section_key)
    })
  }, [blocks, block, select])

  useEffect(() => { wire() }, [wire, stamp])

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) => start(async () => {
    const r = await fn()
    if (r.ok) { setStatus({ kind: 'ok', text: okText }); reload() } else setStatus({ kind: 'error', text: r.error ?? 'Something went wrong.' })
  })

  const setField = <K extends keyof Block>(k: K, v: Block[K]) => setDraft(d => d ? { ...d, [k]: v } : d)
  const itemDraft = (it: Item) => itemDrafts[it.id] ?? it
  const setItemField = (it: Item, k: keyof Item, v: unknown) => setItemDrafts(d => ({ ...d, [it.id]: { ...(d[it.id] ?? it), [k]: v } as Item }))

  const upload = async (file: File | undefined, onUrl: (url: string) => void) => {
    if (!file) return
    const fd = new FormData(); fd.append('file', file)
    setStatus({ kind: 'ok', text: 'Uploading image…' })
    const r = await uploadSiteImage(fd)
    if (r.ok && r.data) { onUrl(r.data.url); setStatus({ kind: 'ok', text: 'Image uploaded — save the section to use it.' }) }
    else setStatus({ kind: 'error', text: r.ok ? 'Upload failed.' : r.error })
  }

  const width = device === 'mobile' ? 390 : device === 'tablet' ? 820 : undefined

  return <div className="builder">
    <header className="builder-bar">
      <nav className="builder-pages">{PAGES.map(p => <a key={p.slug} className={p.slug === pageSlug ? 'builder-page builder-page-active' : 'builder-page'} href={`/editor/builder?page=${p.slug}`}>{p.label}</a>)}</nav>
      <div className="builder-devices">
        {(['desktop', 'tablet', 'mobile'] as const).map(d => <button key={d} type="button" className={device === d ? 'active' : ''} onClick={() => setDevice(d)}>{d}</button>)}
        <a className="button button-outline" href={page.path} target="_blank" rel="noopener">Open live page ↗</a>
      </div>
      {status && <span className={`builder-status builder-status-${status.kind}`}>{pending ? 'Saving…' : status.text}</span>}
    </header>

    <div className="builder-body">
      <div className="builder-preview">
        <iframe ref={frame} key={stamp} title={`Preview of ${page.label}`} src={`${page.path}?builder=${stamp}`} style={width ? { width, margin: '0 auto' } : undefined} onLoad={wire} />
      </div>

      <aside className="builder-panel">
        <div className="builder-tabs">
          <button type="button" className={tab === 'sections' ? 'active' : ''} onClick={() => setTab('sections')}>Sections</button>
          <button type="button" className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Site settings</button>
        </div>

        {tab === 'sections' && <>
          <ol className="builder-outline">
            {blocks.map((b, i) => <li key={b.id} className={b.id === selected ? 'selected' : ''}>
              <button type="button" className="outline-name" onClick={() => select(b.id)}>
                <span>{pretty(b.section_key)}</span><small>{pretty(b.layout)}{b.is_published ? '' : ' · hidden'}</small>
              </button>
              <span className="outline-tools">
                <button type="button" title="Move up" disabled={i === 0 || pending} onClick={() => run(() => reorder('site_content_blocks', b.id, 'up', pageSlug), 'Moved up.')}>↑</button>
                <button type="button" title="Move down" disabled={i === blocks.length - 1 || pending} onClick={() => run(() => reorder('site_content_blocks', b.id, 'down', pageSlug), 'Moved down.')}>↓</button>
                <button type="button" title={b.is_published ? 'Hide' : 'Show'} disabled={pending} onClick={() => run(() => setVisibility('site_content_blocks', b.id, !b.is_published, pageSlug), b.is_published ? 'Section hidden.' : 'Section shown.')}>{b.is_published ? '👁' : '🚫'}</button>
              </span>
            </li>)}
          </ol>

          {draft && block && <form className="builder-form" onSubmit={e => { e.preventDefault(); run(() => saveBlock({ ...draft, page_slug: pageSlug }), 'Section saved.') }}>
            <h3>{pretty(block.section_key)}</h3>
            <p className="field-help">{LAYOUT_HELP[block.layout] ?? 'Section content.'}</p>
            <label>Eyebrow<input value={draft.eyebrow ?? ''} onChange={e => setField('eyebrow', e.target.value)} placeholder="Small label above the heading" /></label>
            <label>Heading<input value={draft.heading} onChange={e => setField('heading', e.target.value)} required /></label>
            <label>Emphasis (bold part of the heading)<input value={draft.heading_emphasis ?? ''} onChange={e => setField('heading_emphasis', e.target.value)} /></label>
            <label>Text<textarea rows={4} value={draft.body ?? ''} onChange={e => setField('body', e.target.value)} /></label>
            <div className="builder-two">
              <label>Button label<input value={draft.cta_label ?? ''} onChange={e => setField('cta_label', e.target.value)} /></label>
              <label>Button link<input value={draft.cta_href ?? ''} onChange={e => setField('cta_href', e.target.value)} placeholder="/register" /></label>
            </div>
            <div className="builder-two">
              <label>Second button<input value={draft.secondary_cta_label ?? ''} onChange={e => setField('secondary_cta_label', e.target.value)} /></label>
              <label>Second link<input value={draft.secondary_cta_href ?? ''} onChange={e => setField('secondary_cta_href', e.target.value)} placeholder="/login" /></label>
            </div>
            <label>Accent colour
              <div className="accent-swatches">{ACCENTS.map(a => <button type="button" key={a} className={`swatch swatch-${a}${draft.accent === a ? ' on' : ''}`} title={a} onClick={() => setField('accent', a)} />)}</div>
            </label>
            <label>Image
              <div className="builder-image">
                {draft.image_url && <img src={draft.image_url} alt="" />}
                <input value={draft.image_url ?? ''} onChange={e => setField('image_url', e.target.value)} placeholder="https://… or /images/…" />
                <input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0], url => setField('image_url', url))} />
              </div>
            </label>
            <label className="switch"><input type="checkbox" checked={draft.is_published} onChange={e => setField('is_published', e.target.checked)} /> Visible on the site</label>
            <button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save section'}</button>
          </form>}

          {block && block.layout !== 'plans' && block.layout !== 'contact' && <section className="builder-items">
            <div className="builder-items-head"><h3>Items in this section</h3>
              <button type="button" className="button button-outline" disabled={pending} onClick={() => run(async () => { const r = await addItem(block.id, pageSlug); if (r.ok && r.data) setItems(list => [...list, r.data!]); return r }, 'Item added.')}>+ Add item</button>
            </div>
            {blockItems.length === 0 && <p className="field-help">No items yet.</p>}
            {blockItems.map((it, i) => { const d = itemDraft(it); return <details className="builder-item" key={it.id}>
              <summary><span>{d.heading || pretty(it.item_key)}</span><small>{it.is_published ? '' : 'hidden'}</small></summary>
              <form onSubmit={e => { e.preventDefault(); run(() => saveItem({ ...d, page_slug: pageSlug }), 'Item saved.') }}>
                <label>Eyebrow<input value={d.eyebrow ?? ''} onChange={e => setItemField(it, 'eyebrow', e.target.value)} /></label>
                <label>Heading<input value={d.heading} onChange={e => setItemField(it, 'heading', e.target.value)} required /></label>
                <label>Text<textarea rows={3} value={d.body ?? ''} onChange={e => setItemField(it, 'body', e.target.value)} /></label>
                <label>Link<input value={d.href ?? ''} onChange={e => setItemField(it, 'href', e.target.value)} placeholder="/page or https://" /></label>
                <label>Accent<div className="accent-swatches">{ACCENTS.map(a => <button type="button" key={a} className={`swatch swatch-${a}${d.accent === a ? ' on' : ''}`} title={a} onClick={() => setItemField(it, 'accent', a)} />)}</div></label>
                <label>Image<div className="builder-image">
                  {d.image_url && <img src={d.image_url} alt="" />}
                  <input value={d.image_url ?? ''} onChange={e => setItemField(it, 'image_url', e.target.value)} placeholder="https://… or /images/…" />
                  <input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0], url => setItemField(it, 'image_url', url))} />
                </div></label>
                <label>Image description<input value={d.image_alt ?? ''} onChange={e => setItemField(it, 'image_alt', e.target.value)} /></label>
                <label className="switch"><input type="checkbox" checked={d.is_published} onChange={e => setItemField(it, 'is_published', e.target.checked)} /> Visible</label>
                <div className="button-row">
                  <button className="button button-primary" type="submit" disabled={pending}>Save item</button>
                  <button type="button" className="button button-outline" disabled={i === 0 || pending} onClick={() => run(() => reorder('site_content_items', it.id, 'up', pageSlug), 'Moved.')}>↑</button>
                  <button type="button" className="button button-outline" disabled={i === blockItems.length - 1 || pending} onClick={() => run(() => reorder('site_content_items', it.id, 'down', pageSlug), 'Moved.')}>↓</button>
                  <button type="button" className="button button-danger" disabled={pending} onClick={() => { if (confirm('Delete this item?')) run(async () => { const r = await deleteItem(it.id, pageSlug); if (r.ok) setItems(list => list.filter(x => x.id !== it.id)); return r }, 'Item deleted.') }}>Delete</button>
                </div>
              </form>
            </details> })}
          </section>}
        </>}

        {tab === 'settings' && <SettingsPanel settings={settings} pending={pending} onSave={(k, v) => run(() => saveSetting(k, v), 'Setting saved.')} />}
      </aside>
    </div>
  </div>
}

function SettingsPanel({ settings, pending, onSave }: { settings: Setting[]; pending: boolean; onSave: (key: string, value: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(settings.map(s => [s.key, s.value])))
  const groups: Array<[string, (s: Setting) => boolean]> = [
    ['Site identity', s => s.key.startsWith('site_')],
    ['Contact details', s => s.key.startsWith('contact_') || s.key.startsWith('address') || s.key.startsWith('social_')],
    ['Payments', s => s.key.startsWith('payment')],
    ['Everything else', s => !s.key.startsWith('site_') && !s.key.startsWith('contact_') && !s.key.startsWith('address') && !s.key.startsWith('social_') && !s.key.startsWith('payment')],
  ]
  return <div className="builder-form">
    <p className="field-help">These values feed the header, footer, contact block and billing page. Each field saves on its own.</p>
    {groups.map(([name, match]) => {
      const rows = settings.filter(match)
      if (rows.length === 0) return null
      return <details key={name} open={name === 'Site identity'}>
        <summary>{name}</summary>
        {rows.map(s => <label key={s.key}>{s.label}
          {s.key === 'payment_mode'
            ? <select value={values[s.key] ?? ''} onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}><option value="test">Test (simulated checkout)</option><option value="live">Live (payment provider)</option></select>
            : (s.value.length > 80 || s.key.endsWith('_instructions') || s.key.endsWith('_body'))
              ? <textarea rows={3} value={values[s.key] ?? ''} onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))} />
              : <input value={values[s.key] ?? ''} onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))} />}
          {s.help && <small>{s.help}</small>}
          <button type="button" className="button button-outline" disabled={pending || (values[s.key] ?? '') === s.value} onClick={() => onSave(s.key, values[s.key] ?? '')}>Save</button>
        </label>)}
      </details>
    })}
  </div>
}
