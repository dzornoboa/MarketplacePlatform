import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { date } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { createOrganisation, updateOrganisation } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function OrganisationPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  // RLS returns only organisations this member belongs to.
  const { data: memberships } = await supabase.from('organization_members').select('organization_id,role').eq('user_id', profile.id)
  const orgIds = (memberships ?? []).map(m => m.organization_id)
  const { data: organisations } = orgIds.length
    ? await supabase.from('organizations').select('*').in('id', orgIds)
    : { data: [] }
  const roleByOrg = new Map((memberships ?? []).map(m => [m.organization_id, m.role]))

  const { data: colleagues } = orgIds.length
    ? await supabase.from('organization_members').select('organization_id,user_id,role').in('organization_id', orgIds)
    : { data: [] }
  const colleagueIds = [...new Set((colleagues ?? []).map(c => c.user_id))]
  const { data: people } = colleagueIds.length
    ? await supabase.from('profiles').select('id,full_name,job_title').in('id', colleagueIds)
    : { data: [] }
  const personById = new Map((people ?? []).map(p => [p.id, p]))

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Organisation</p>
      <h1>Your organisation</h1>
      <p className="muted">Opportunities can be owned by an organisation rather than an individual, so colleagues keep access when people change roles.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {(organisations ?? []).length === 0
      ? <>
          <section className="card empty-state"><BrandCircle /><h2>No organisation yet</h2><p>Create one to own listings on behalf of your company.</p></section>
          <form action={createOrganisation} className="card form-stack">
            <h2>Create an organisation</h2>
            <label>Organisation name<input name="name" minLength={2} maxLength={160} required /></label>
            <div className="form-grid">
              <label>Registration number<input name="registrationNumber" placeholder="Optional" /></label>
              <label>Website<input name="website" placeholder="https://" /></label>
            </div>
            <div className="form-grid">
              <label>Country<input name="country" defaultValue="Ghana" /></label>
              <label>City<input name="city" placeholder="Accra" /></label>
            </div>
            <label>Description<textarea name="description" rows={4} placeholder="What the organisation does." /></label>
            <button className="button button-primary" type="submit">Create organisation</button>
          </form>
        </>
      : (organisations ?? []).map(org => {
          const myRole = roleByOrg.get(org.id)
          const canEdit = myRole === 'owner' || myRole === 'admin'
          const team = (colleagues ?? []).filter(c => c.organization_id === org.id)
          return <section className="card" key={org.id}>
            <div className="review-head">
              <div><h2>{org.name}</h2><p>{[org.city, org.country].filter(Boolean).join(', ') || 'Location not set'} · created {date(org.created_at)}</p></div>
              <span className={org.is_verified ? 'status-dot status-verified' : 'status-dot'}>{org.is_verified ? 'Verified' : 'Unverified'}</span>
            </div>

            {canEdit
              ? <form action={updateOrganisation} className="form-stack">
                  <input type="hidden" name="organisationId" value={org.id} />
                  <label>Organisation name<input name="name" defaultValue={org.name} required /></label>
                  <div className="form-grid">
                    <label>Registration number<input name="registrationNumber" defaultValue={org.registration_number ?? ''} /></label>
                    <label>Website<input name="website" defaultValue={org.website ?? ''} placeholder="https://" /></label>
                  </div>
                  <div className="form-grid">
                    <label>Country<input name="country" defaultValue={org.country ?? ''} /></label>
                    <label>City<input name="city" defaultValue={org.city ?? ''} /></label>
                  </div>
                  <label>Description<textarea name="description" rows={4} defaultValue={org.description ?? ''} /></label>
                  <button className="button button-primary" type="submit">Save organisation</button>
                </form>
              : <p className="muted">{org.description || 'No description provided.'}</p>}

            <div className="item-editor">
              <h3>Team ({team.length})</h3>
              <div className="history-list">{team.map(member => {
                const person = personById.get(member.user_id)
                return <div key={member.user_id}>
                  <strong>{person?.full_name ?? 'Member'}</strong>
                  <span>{humanize(member.role)}</span>
                  {person?.job_title && <p className="muted">{person.job_title}</p>}
                </div>
              })}</div>
              <p className="field-help">Colleagues are added by WTC Accra during verification. Contact support to add or remove someone.</p>
            </div>
          </section>
        })}
  </div>
}
