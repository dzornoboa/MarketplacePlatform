import { requireCapability } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { updateSettings, updateNavLink, createNavLink, deleteNavLink } from './actions'

export const dynamic = 'force-dynamic'

const PLACEMENTS = [
  { key: 'header', label: 'Header navigation' },
  { key: 'footer_platform', label: 'Footer — Platform column' },
  { key: 'footer_access', label: 'Footer — Access column' },
  { key: 'legal', label: 'Legal links' },
] as const

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function EditorSettingsPage({ searchParams }: Props) {
  const { supabase } = await requireCapability('content')
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const [{ data: settings }, { data: links }] = await Promise.all([
    supabase.from('site_settings').select('*').order('key'),
    supabase.from('site_nav_links').select('*').order('placement').order('sort_order'),
  ])

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Public website</p>
      <h1>Settings and navigation</h1>
      <p className="muted">Global strings and the menus shown in the header and footer. These replace what used to be hardcoded in the site.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card">
      <h2>Website text</h2>
      <form action={updateSettings} className="form-stack">
        {(settings ?? []).map(setting => <label key={setting.key}>
          {setting.label}
          {setting.value.length > 90
            ? <textarea name={`setting__${setting.key}`} rows={3} defaultValue={setting.value} />
            : <input name={`setting__${setting.key}`} defaultValue={setting.value} />}
          {setting.help && <span className="field-help">{setting.help}</span>}
        </label>)}
        <button className="button button-primary" type="submit">Save website text</button>
      </form>
    </section>

    {PLACEMENTS.map(placement => {
      const group = (links ?? []).filter(l => l.placement === placement.key)
      return <section className="card" key={placement.key}>
        <h2>{placement.label}</h2>
        {group.length === 0 && <p className="muted">No links in this menu yet.</p>}
        {group.map(link => <form action={updateNavLink} className="nav-link-row" key={link.id}>
          <input type="hidden" name="linkId" value={link.id} />
          <label>Label<input name="label" defaultValue={link.label} required /></label>
          <label>Link<input name="href" defaultValue={link.href} required /></label>
          <label>Order<input name="sortOrder" type="number" defaultValue={link.sort_order} /></label>
          <label className="switch"><input type="checkbox" name="isPublished" defaultChecked={link.is_published} /> Visible</label>
          <button className="button button-secondary" type="submit">Save</button>
        </form>)}
        {group.map(link => <form action={deleteNavLink} className="nav-link-delete" key={`delete-${link.id}`}>
          <input type="hidden" name="linkId" value={link.id} />
          <button className="link-button link-button-danger" type="submit">Remove “{link.label}”</button>
        </form>)}
        <form action={createNavLink} className="nav-link-row nav-link-new">
          <input type="hidden" name="placement" value={placement.key} />
          <label>New label<input name="label" placeholder="Page name" /></label>
          <label>New link<input name="href" placeholder="/news" /></label>
          <label>Order<input name="sortOrder" type="number" defaultValue={(group.at(-1)?.sort_order ?? 0) + 10} /></label>
          <button className="button button-outline" type="submit">Add link</button>
        </form>
      </section>
    })}

    <section className="card">
      <h2>Where these appear</h2>
      <ul className="plain-list">
        {PLACEMENTS.map(p => <li key={p.key}><strong>{p.label}</strong> — {humanize(p.key)}</li>)}
      </ul>
      <p className="field-help">Links must start with <code>/</code> for an internal page, <code>#</code> for a section on the home page, or <code>https://</code> for an external site.</p>
    </section>
  </div>
}
