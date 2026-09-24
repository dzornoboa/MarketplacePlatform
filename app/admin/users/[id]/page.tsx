import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { Avatar } from '@/components/avatar'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { notFound } from 'next/navigation'
import { requireAdminProfile } from '@/lib/auth/guards'
import { requiredDocuments, purposeLabel } from '@/lib/kyc'
import { humanize, labelForParticipantType, systemRoleLabels, systemRoles, accountStatuses, selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'
import { date, dateTime, money } from '@/lib/format'
import { SubmitButton } from '@/components/submit-button'
import { updateMarketplaceAccess, updateAccountStatus, updateStaffRole, setVerificationStatus, messageMember, setMemberSubscription, setSupportBypass, sendPasswordReset, adminUpdateProfile } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

/* One member, everything staff need in one place: profile, organisation,
   documents, verification history, subscriptions and payments, plus the
   controls to change any of it and to message the member. */
export default async function AdminMemberPage({ params, searchParams }: Props) {
  const { supabase, profile: me } = await requireAdminProfile()
  const { id } = await params
  const sp = await searchParams
  const error = typeof sp.error === 'string' ? sp.error : null
  const message = typeof sp.message === 'string' ? sp.message : null

  const { data: person } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (!person) notFound()
  const { data: email } = await supabase.rpc('member_email', { target_user: id })
  const bypassActive = !!person.support_bypass_until && new Date(person.support_bypass_until) > new Date()
  const self = person.id === me.id

  const [{ data: requests }, { data: docs }, { data: subs }, { data: payments }, { data: orgLinks }, { data: plans }, { data: notes }, { data: listings }, { data: bids }, { data: memberships }, { data: billingRow }] = await Promise.all([
    supabase.from('verification_requests').select('*').eq('user_id', id).order('submitted_at', { ascending: false }),
    supabase.from('document_records').select('id,file_name,purpose,created_at,opportunity_id').eq('owner_user_id', id).order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('organization_members').select('organization_id,role').eq('user_id', id),
    supabase.from('subscription_plans').select('code,name,price_usd').eq('active', true).order('price_usd'),
    supabase.from('notifications').select('id,title,body,kind,created_at,read_at').eq('user_id', id).order('created_at', { ascending: false }).limit(15),
    supabase.from('opportunities').select('id,title,status,created_at').eq('owner_user_id', id).order('created_at', { ascending: false }),
    supabase.from('expressions_of_interest').select('id,opportunity_id,status,created_at').eq('applicant_id', id).order('created_at', { ascending: false }),
    supabase.from('memberships').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    supabase.from('billing_addresses').select('user_id').eq('user_id', id).maybeSingle(),
  ])
  const billingOnFile = !!billingRow
  const orgIds = (orgLinks ?? []).map(o => o.organization_id)
  const { data: orgs } = orgIds.length ? await supabase.from('organizations').select('*').in('id', orgIds) : { data: [] }
  const current = (subs ?? []).find(s => s.status === 'active') ?? (subs ?? []).find(s => s.status === 'pending')
  const company = ['business', 'wtc_association_member', 'wtc_accra_member'].includes(person.participant_type ?? person.requested_participant_type ?? '')

  return <div className="page-stack">
    <RealtimeRefresh tables={["profiles","subscriptions","payments","verification_requests"]} />
    <p><Link className="arrow-link" href="/admin/users">← All members</Link></p>
    <div className="review-head">
      <div>
        <p className="eyebrow">Member</p>
        <h1 className="avatar-stack"><Avatar src={person.avatar_url} name={person.full_name} size={44} />{person.full_name || 'Unnamed member'}<VerifiedCheck verified={person.verification_status === 'verified'} size={22} /></h1>
        <p className="muted"><ParticipantBadge type={person.participant_type} requested={person.requested_participant_type} size="md" /> · {person.country || 'Country not set'} · joined {date(person.created_at)}</p>
      </div>
      <div className="pill-row">
        <span className={`status-dot status-${person.verification_status}`}>{humanize(person.verification_status)}</span>
        <span className={`status-dot status-${person.account_status}`}>{humanize(person.account_status)}</span>
        {current && <span className={`status-dot status-sub-${current.status}`}>{current.plan_code.replaceAll('_', ' ')} · {current.status}</span>}
        {bypassActive && <span className="status-dot status-pending">Support bypass to {date(person.support_bypass_until)}</span>}
      </div>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <div className="split-grid admin-detail-grid">
      <section className="card">
        <h2>Profile</h2>
        <dl className="detail-grid detail-grid-two">
          <div><dt>Email</dt><dd>{email ?? '—'}</dd></div>
          <div><dt>Phone</dt><dd>{person.phone || '—'}</dd></div>
          <div><dt>Job title</dt><dd>{person.job_title || '—'}</dd></div>
          <div><dt>City</dt><dd>{person.city || '—'}</dd></div>
          <div><dt>Role</dt><dd>{systemRoleLabels[person.system_role] ?? person.system_role}</dd></div>
          <div><dt>WTCA member no.</dt><dd>{person.wtca_membership_number || '—'}</dd></div>
          <div><dt>WTCA chapter</dt><dd>{person.wtca_chapter || '—'}</dd></div>
          <div><dt>Browsing</dt><dd>{person.can_view_opportunities ? 'Allowed' : 'Blocked'}</dd></div>
          <div><dt>Posting</dt><dd>{person.can_post_opportunities ? 'Allowed' : 'Blocked'}</dd></div>
          <div><dt>Verified</dt><dd>{person.verified_at ? dateTime(person.verified_at) : '—'}</dd></div>
          <div><dt>Chosen plan</dt><dd>{person.requested_plan_code?.replaceAll('_', ' ') ?? '—'}</dd></div>
        </dl>
        {(orgs ?? []).map(org => <dl className="detail-grid detail-grid-two" key={org.id}>
          <div><dt>Organisation</dt><dd>{org.name}{org.is_verified ? ' ✓' : ''}</dd></div>
          <div><dt>Registration no.</dt><dd>{org.registration_number || '—'}</dd></div>
          <div><dt>Website</dt><dd>{org.website ? <a className="arrow-link" href={org.website} target="_blank" rel="noopener">{org.website}</a> : '—'}</dd></div>
          <div><dt>Location</dt><dd>{[org.city, org.country].filter(Boolean).join(', ') || '—'}</dd></div>
        </dl>)}
        {company && (orgs ?? []).length === 0 && <p className="field-help">Company participant without an organisation record.</p>}
      </section>

      <section className="card">
        <h2>Documents</h2>
        {(docs ?? []).length === 0
          ? <p className="muted">Nothing uploaded.</p>
          : <div className="history-list compact">{(docs ?? []).map(d => <div key={d.id}>
              <strong>{d.file_name}</strong><span>{date(d.created_at)}</span>
              <p className="muted">{purposeLabel(d.purpose)}{d.opportunity_id ? ' · listing attachment' : ''} · <a className="arrow-link" href={`/api/documents/${d.id}`} target="_blank" rel="noopener">Open →</a></p>
            </div>)}</div>}
        <p className="field-help">Required for {company || (orgLinks ?? []).length > 0 ? 'a company' : 'an individual'}: {requiredDocuments(person.participant_type ?? person.requested_participant_type, (orgLinks ?? []).length > 0).map(r => `${purposeLabel(r).split(' (')[0]} ${(docs ?? []).some(d => d.purpose === r) ? '✓' : '✗'}`).join(' · ')} · Billing address {billingOnFile ? '✓' : '✗'}</p>
      </section>
    </div>

    {self ? <p className="field-help">This is your own account. Use another administrator to change it.</p> : <div className="admin-action-grid">
      <form action={setVerificationStatus} className="card review-form check-card">
        <h3><VerifiedCheck verified size={18} /> Verified check</h3>
        <p className="muted">{person.verification_status === 'verified'
          ? 'This member carries the WTC Accra verified check on their profile and listings.'
          : 'Not verified: the member can use the platform on their subscription but shows no check mark. Grant it once their registration documents check out.'}</p>
        <input type="hidden" name="userId" value={person.id} />
        <select name="verificationStatus" defaultValue={person.verification_status === 'verified' ? 'changes_requested' : 'verified'}>
          <option value="verified">Grant verified check</option>
          <option value="changes_requested">Remove check — request changes</option>
          <option value="pending_review">Remove check — back to pending review</option>
          <option value="rejected">Remove check — rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <textarea name="note" rows={2} placeholder="Note shown to the member, e.g. what to fix." />
        <SubmitButton pendingLabel="Saving…">{person.verification_status === 'verified' ? 'Update check' : 'Apply'}</SubmitButton>
      </form>

      <form action={messageMember} className="card review-form">
        <h3>Message the member</h3>
        <input type="hidden" name="userId" value={person.id} />
        <input name="title" placeholder="Subject" required />
        <textarea name="body" rows={3} placeholder="What do they need to do or know?" required />
        <select name="href" defaultValue="/dashboard/notifications">
          <option value="/dashboard/notifications">Link: notifications</option>
          <option value="/dashboard/verification">Link: verification page</option>
          <option value="/dashboard/profile">Link: profile</option>
          <option value="/dashboard/billing">Link: billing</option>
          <option value="/dashboard/opportunities">Link: their listings</option>
        </select>
        <SubmitButton className="button button-secondary" pendingLabel="Sending…">Send message</SubmitButton>
      </form>

      <form action={setMemberSubscription} className="card review-form">
        <h3>Subscription</h3>
        <input type="hidden" name="userId" value={person.id} />
        <select name="planCode" defaultValue={current?.plan_code ?? person.requested_plan_code ?? ''} required>
          <option value="" disabled>Plan</option>
          {(plans ?? []).map(p => <option key={p.code} value={p.code}>{p.name} · {Number(p.price_usd) === 0 ? 'Free' : money(p.price_usd)}</option>)}
        </select>
        <select name="subscriptionStatus" defaultValue={current?.status ?? 'active'}>
          {['active', 'pending', 'past_due', 'expired', 'cancelled'].map(s => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
        <div className="split-grid">
          <label>Starts<input type="date" name="startsAt" defaultValue={current?.starts_at?.slice(0, 10) ?? ''} /></label>
          <label>Ends<input type="date" name="endsAt" defaultValue={current?.ends_at?.slice(0, 10) ?? ''} /></label>
        </div>
        <input name="note" placeholder="Note to the member (optional)" />
        <SubmitButton className="button button-secondary" pendingLabel="Saving…">Save subscription</SubmitButton>
      </form>

      <form action={updateMarketplaceAccess} className="card review-form">
        <h3>Marketplace access</h3>
        <input type="hidden" name="userId" value={person.id} /><input type="hidden" name="returnTo" value="detail" />
        <div className="switch-row">
          <label className="switch"><input type="checkbox" name="allowView" defaultChecked={person.can_view_opportunities} /> Can browse</label>
          <label className="switch"><input type="checkbox" name="allowPost" defaultChecked={person.can_post_opportunities} /> Can post</label>
        </div>
        <input name="reason" placeholder="Reason (audit log)" />
        <SubmitButton className="button button-outline" pendingLabel="Saving…">Save access</SubmitButton>
      </form>

      <form action={updateAccountStatus} className="card review-form">
        <h3>Account status</h3>
        <input type="hidden" name="userId" value={person.id} /><input type="hidden" name="returnTo" value="detail" />
        <select name="accountStatus" defaultValue={person.account_status}>{accountStatuses.map(s => <option key={s} value={s}>{humanize(s)}</option>)}</select>
        <input name="reason" placeholder="Reason (optional)" />
        <SubmitButton className="button button-outline" pendingLabel="Saving…">Update status</SubmitButton>
      </form>

      <form action={setSupportBypass} className="card review-form">
        <h3>Support bypass</h3>
        <p className="field-help">Open the marketplace temporarily without a subscription — for support cases only. Recorded in the audit log.</p>
        <input type="hidden" name="userId" value={person.id} />
        <select name="days" defaultValue={bypassActive ? '0' : '7'}>
          <option value="0">{bypassActive ? 'Remove bypass' : 'No bypass'}</option>
          <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
        </select>
        <input name="reason" placeholder="Reason (shown to the member)" defaultValue={person.support_bypass_reason ?? ''} />
        <SubmitButton className="button button-outline" pendingLabel="Saving…">Apply</SubmitButton>
      </form>

      <form action={sendPasswordReset} className="card review-form">
        <h3>Password reset</h3>
        <p className="field-help">Emails the member a reset link{email ? ` (${email})` : ''} and notifies them in-app. Support never sees or sets the password.</p>
        <input type="hidden" name="userId" value={person.id} />
        <SubmitButton className="button button-outline" pendingLabel="Sending…">Send reset link</SubmitButton>
      </form>

      <form action={updateStaffRole} className="card review-form">
        <h3>System role</h3>
        <input type="hidden" name="userId" value={person.id} /><input type="hidden" name="returnTo" value="detail" />
        <select name="systemRole" defaultValue={person.system_role}>{systemRoles.map(r => <option key={r} value={r}>{systemRoleLabels[r]}</option>)}</select>
        <p className="field-help">Super administrators only.</p>
        <SubmitButton className="button button-outline" pendingLabel="Saving…">Update role</SubmitButton>
      </form>
    </div>}

    {!self && <form action={adminUpdateProfile} className="card form-stack">
      <h2>Edit profile details</h2>
      <p className="muted">Correct details on the member's behalf. Changing the participant type re-targets the plans they can buy.</p>
      <input type="hidden" name="userId" value={person.id} />
      <div className="form-grid">
        <label>Full name<input name="fullName" defaultValue={person.full_name} required /></label>
        <label>Participant type<select name="participantType" defaultValue={person.participant_type ?? ''}><option value="">Leave unchanged</option>{selectableParticipantTypes.map(t => <option key={t} value={t}>{participantTypeLabels[t]}</option>)}</select></label>
      </div>
      <div className="form-grid">
        <label>Phone<input name="phone" defaultValue={person.phone ?? ''} /></label>
        <label>Job title<input name="jobTitle" defaultValue={person.job_title ?? ''} /></label>
      </div>
      <div className="form-grid">
        <label>Country<input name="country" defaultValue={person.country ?? ''} /></label>
        <label>City<input name="city" defaultValue={person.city ?? ''} /></label>
      </div>
      <div className="form-grid">
        <label>WTCA membership no.<input name="wtcaNumber" defaultValue={person.wtca_membership_number ?? ''} /></label>
        <label>WTCA chapter<input name="wtcaChapter" defaultValue={person.wtca_chapter ?? ''} /></label>
      </div>
      <div><SubmitButton pendingLabel="Saving…">Save profile</SubmitButton></div>
    </form>}

    <div className="split-grid admin-detail-grid">
      <section className="card">
        <h2>Subscriptions</h2>
        {(subs ?? []).length === 0 ? <p className="muted">None.</p> : <div className="history-list compact">{(subs ?? []).map(s => <div key={s.id}>
          <strong>{s.plan_code.replaceAll('_', ' ')}</strong><span className={`status-dot status-sub-${s.status}`}>{humanize(s.status)}</span>
          <p className="muted">{s.starts_at ? `from ${date(s.starts_at)}` : 'not started'}{s.ends_at ? ` to ${date(s.ends_at)}` : ''} · requested {date(s.created_at)}</p>
        </div>)}</div>}
        <h2>Payments</h2>
        {(payments ?? []).length === 0 ? <p className="muted">None.</p> : <div className="history-list compact">{(payments ?? []).map(p => <div key={p.id}>
          <strong>{p.reference}</strong><span className={`status-dot status-pay-${p.status}`}>{humanize(p.status)}</span>
          <p className="muted">{money(p.amount, p.currency)} · {humanize(p.method)} · {p.provider}{p.paid_at ? ` · paid ${dateTime(p.paid_at)}` : ''}</p>
        </div>)}</div>}
        {(memberships ?? []).length > 0 && <><h2>WTC membership</h2><div className="history-list compact">{(memberships ?? []).map(m => <div key={m.id}>
          <strong>{m.membership_type_code.replaceAll('_', ' ')}</strong><span>{humanize(m.status)}</span>
          <p className="muted">{m.member_number ?? ''}{m.valid_until ? ` · valid to ${date(m.valid_until)}` : ''}</p>
        </div>)}</div></>}
      </section>

      <section className="card">
        <h2>Verification history</h2>
        {(requests ?? []).length === 0 ? <p className="muted">No application submitted yet.</p> : <div className="history-list compact">{(requests ?? []).map(r => <div key={r.id}>
          <strong>{humanize(r.status)}</strong><span>{dateTime(r.submitted_at)}</span>
          {r.submission_note && <p className="muted">Applicant: {r.submission_note}</p>}
          {r.reviewer_note && <p className="muted">Reviewer: {r.reviewer_note}</p>}
        </div>)}</div>}
        <h2>Activity</h2>
        <p className="muted">{(listings ?? []).length} listing{(listings ?? []).length === 1 ? '' : 's'} · {(bids ?? []).length} bid{(bids ?? []).length === 1 ? '' : 's'}</p>
        {(listings ?? []).length > 0 && <div className="history-list compact">{(listings ?? []).map(l => <div key={l.id}>
          <strong><Link href={`/admin/opportunities?status=${l.status}`}>{l.title}</Link></strong><span className={`status-dot status-opp-${l.status}`}>{humanize(l.status)}</span>
        </div>)}</div>}
        <h2>Messages sent</h2>
        {(notes ?? []).length === 0 ? <p className="muted">None yet.</p> : <div className="history-list compact">{(notes ?? []).map(n => <div key={n.id}>
          <strong>{n.title}</strong><span>{dateTime(n.created_at)}{n.read_at ? ' · read' : ''}</span>
          {n.body && <p className="muted">{n.body}</p>}
        </div>)}</div>}
      </section>
    </div>
  </div>
}
