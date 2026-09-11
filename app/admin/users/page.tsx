import { requireAdminProfile } from '@/lib/auth/guards'
import { humanize, labelForParticipantType, systemRoleLabels, systemRoles, accountStatuses } from '@/lib/auth/access'
import { date } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { updateMarketplaceAccess, updateAccountStatus, updateStaffRole } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminUsersPage({ searchParams }: Props) {
  const { supabase, profile: me } = await requireAdminProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null
  const filter = typeof params.status === 'string' ? params.status : ''
  const search = typeof params.q === 'string' ? params.q.trim() : ''

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200)
  if (filter) query = query.eq('verification_status', filter as 'verified')
  if (search) query = query.ilike('full_name', `%${search}%`)
  const { data: profiles } = await query

  const ids = (profiles ?? []).map(p => p.id)
  const { data: subs } = ids.length
    ? await supabase.from('subscriptions').select('user_id,plan_code,status,ends_at').in('user_id', ids).eq('status', 'active')
    : { data: [] }
  const subByUser = new Map((subs ?? []).map(s => [s.user_id, s]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">User administration</p>
      <h1>Members and access</h1>
      <p className="muted">Verification, marketplace switches, account status and staff roles. Every change is audited and pushed to the member in realtime.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <form className="filter-row card" method="get">
      <label>Search name<input name="q" defaultValue={search} placeholder="Member name" /></label>
      <label>Verification
        <select name="status" defaultValue={filter}>
          <option value="">All statuses</option>
          <option value="pending_profile">Pending profile</option>
          <option value="pending_review">Pending review</option>
          <option value="verified">Verified</option>
          <option value="changes_requested">Changes requested</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      <button className="button button-outline" type="submit">Apply</button>
    </form>

    {(profiles ?? []).length === 0
      ? <section className="card empty-state"><BrandCircle /><h2>No members match</h2><p>Adjust the filters above.</p></section>
      : <div className="review-list">{(profiles ?? []).map(person => {
          const self = person.id === me.id
          const sub = subByUser.get(person.id)
          return <article className="card review-card" key={person.id}>
            <div className="review-head">
              <div>
                <h2>{person.full_name || 'Unnamed member'}</h2>
                <p>{labelForParticipantType(person.participant_type)} · {person.country || 'Country not set'} · joined {date(person.created_at)}</p>
              </div>
              <div className="pill-row">
                <span className={`status-dot status-${person.verification_status}`}>{humanize(person.verification_status)}</span>
                <span className={`status-dot status-${person.account_status}`}>{humanize(person.account_status)}</span>
                {sub && <span className="status-dot status-verified">{sub.plan_code.replaceAll('_', ' ')}</span>}
              </div>
            </div>

            <dl className="detail-grid">
              <div><dt>Role</dt><dd>{systemRoleLabels[person.system_role] ?? person.system_role}</dd></div>
              <div><dt>Browsing</dt><dd>{person.can_view_opportunities ? 'Allowed' : 'Blocked'}</dd></div>
              <div><dt>Posting</dt><dd>{person.can_post_opportunities ? 'Allowed' : 'Blocked'}</dd></div>
              <div><dt>Subscription</dt><dd>{sub ? `Active to ${date(sub.ends_at)}` : 'None'}</dd></div>
            </dl>

            {self
              ? <p className="field-help">This is your own account. Use another administrator to change it.</p>
              : <div className="admin-action-grid">
                  <form action={updateMarketplaceAccess} className="review-form">
                    <label>Marketplace access</label>
                    <div className="switch-row">
                      <label className="switch"><input type="checkbox" name="allowView" defaultChecked={person.can_view_opportunities} /> Can browse opportunities</label>
                      <label className="switch"><input type="checkbox" name="allowPost" defaultChecked={person.can_post_opportunities} /> Can post opportunities</label>
                    </div>
                    <input type="hidden" name="userId" value={person.id} />
                    <input name="reason" placeholder="Reason (optional, recorded in the audit log)" />
                    <button className="button button-primary" type="submit">Save access</button>
                  </form>

                  <form action={updateAccountStatus} className="review-form">
                    <label>Account status</label>
                    <input type="hidden" name="userId" value={person.id} />
                    <select name="accountStatus" defaultValue={person.account_status}>
                      {accountStatuses.map(s => <option key={s} value={s}>{humanize(s)}</option>)}
                    </select>
                    <input name="reason" placeholder="Reason (optional)" />
                    <button className="button button-secondary" type="submit">Update status</button>
                  </form>

                  <form action={updateStaffRole} className="review-form">
                    <label>System role</label>
                    <input type="hidden" name="userId" value={person.id} />
                    <select name="systemRole" defaultValue={person.system_role}>
                      {systemRoles.map(r => <option key={r} value={r}>{systemRoleLabels[r]}</option>)}
                    </select>
                    <p className="field-help">Only a super administrator can change roles.</p>
                    <button className="button button-outline" type="submit">Update role</button>
                  </form>
                </div>}
          </article>
        })}</div>}
  </div>
}
