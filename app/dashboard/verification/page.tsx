import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize, labelForParticipantType } from '@/lib/auth/access'
import { money, date } from '@/lib/format'
import { SubmitButton } from '@/components/submit-button'
import { submitVerification, choosePlan } from './actions'
import { uploadDocument } from '../documents/actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const COMPANY_TYPES = new Set(['business', 'project_sponsor', 'institutional_partner', 'wtc_association_member', 'wtc_accra_member'])

/* Onboarding, per the scoping document:
   register → complete profile → submit documents → WTC review → verify →
   select plan → activate. Everything a member must do before WTC Accra can
   review them is a checklist item here; "Submit for review" only appears
   once every item is done. */
export default async function VerificationPage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const type = profile.requested_participant_type ?? profile.participant_type
  const isCompany = !!type && COMPANY_TYPES.has(type)

  const [{ data: requests }, { data: documents }, { count: orgCount }, { data: plans }, { data: subscription }] = await Promise.all([
    supabase.from('verification_requests').select('*').eq('user_id', profile.id).order('submitted_at', { ascending: false }).limit(5),
    supabase.from('document_records').select('id,file_name,purpose,created_at').eq('owner_user_id', profile.id).in('purpose', ['identity', 'business_certificate', 'profile']),
    supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    supabase.from('subscription_plans').select('*').eq('active', true).order('price_usd'),
    supabase.from('subscriptions').select('plan_code,status,ends_at').in('status', ['pending', 'active']).limit(1).maybeSingle(),
  ])

  const current = requests?.[0]
  const hasIdentity = (documents ?? []).some(d => d.purpose === 'identity')
  const hasCertificate = (documents ?? []).some(d => d.purpose === 'business_certificate')
  const hasOrg = (orgCount ?? 0) > 0
  const profileDone = profile.profile_completed && !!type && profile.full_name.trim().length >= 2
  const eligiblePlans = (plans ?? []).filter(p => !type || p.target_participant_types.length === 0 || p.target_participant_types.includes(type))
  const chosenPlan = (plans ?? []).find(p => p.code === profile.requested_plan_code)

  const steps = [
    { key: 'profile', label: 'Complete your profile and choose a participant type', done: profileDone, href: '/dashboard/profile', required: true },
    { key: 'org', label: 'Add your organisation', done: hasOrg, href: '/dashboard/organisation', required: isCompany },
    { key: 'identity', label: 'Upload an identity document', done: hasIdentity, href: '#documents', required: true },
    { key: 'certificate', label: 'Upload your business registration certificate', done: hasCertificate, href: '#documents', required: isCompany },
    { key: 'plan', label: 'Choose a plan', done: !!chosenPlan, href: '#plan', required: false },
  ].filter(s => s.required || s.key === 'plan')
  const ready = steps.filter(s => s.required).every(s => s.done)
  const canSubmit = ['pending_profile', 'changes_requested', 'rejected'].includes(profile.verification_status)

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Verification</p>
      <h1>WTC Accra account verification</h1>
      <p className="muted">Verification protects the marketplace: every participant is checked by WTC Accra before they can see other members&rsquo; deals or bid on them.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    {/* ---- Status ---------------------------------------------------- */}
    <section className="card status-card">
      <span className={`status-dot status-${profile.verification_status}`}>{humanize(profile.verification_status)}</span>
      {profile.verification_status === 'pending_profile' && <><h2>Get verified</h2><p>Work through the checklist below, then submit. You are applying as <strong>{labelForParticipantType(type)}</strong>.</p></>}
      {profile.verification_status === 'pending_review' && <>
        <h2>Your application is with WTC Accra</h2>
        <p>Submitted {date(current?.submitted_at)}. The verification team is reviewing your profile and documents — you will be notified here and by email as soon as there is a decision. Nothing more is needed from you right now.</p>
        <p className="field-help">While you wait you can read WTC Accra news, browse the live-listing teasers, and prepare your organisation profile.</p>
      </>}
      {profile.verification_status === 'verified' && <>
        <h2>Verified</h2>
        <p>Your approved participant type is <strong>{labelForParticipantType(profile.participant_type)}</strong>.</p>
        {subscription?.status === 'active'
          ? <p>Your <strong>{subscription.plan_code.replaceAll('_', ' ')}</strong> subscription is active{subscription.ends_at ? ` until ${date(subscription.ends_at)}` : ''}. Marketplace access is enabled.</p>
          : subscription?.status === 'pending'
            ? <><p>Your <strong>{subscription.plan_code.replaceAll('_', ' ')}</strong> plan is awaiting payment. Marketplace browsing unlocks once it is paid.</p><Link className="button button-primary" href="/dashboard/billing">Pay now</Link></>
            : <><p>Choose and activate a plan to open the marketplace.</p><Link className="button button-primary" href="/dashboard/billing">Choose a plan</Link></>}
      </>}
      {profile.verification_status === 'changes_requested' && <><h2>Changes requested</h2><p>{current?.reviewer_note || 'WTC Accra requested updates to your profile.'}</p><p className="field-help">Make the changes, then resubmit below.</p></>}
      {profile.verification_status === 'rejected' && <><h2>Verification rejected</h2><p>{current?.reviewer_note || 'Contact WTC Accra support for clarification before resubmitting.'}</p></>}
      {profile.verification_status === 'suspended' && <><h2>Account suspended</h2><p>Contact WTC Accra support. Opportunity access is disabled.</p></>}
    </section>

    {canSubmit && <>
      {/* ---- Checklist ------------------------------------------------ */}
      <section className="card">
        <h2>Before you submit</h2>
        <ol className="checklist">
          {steps.map(step => <li key={step.key} className={step.done ? 'checklist-done' : ''}>
            <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
            <Link href={step.href}>{step.label}{!step.required && <span className="field-help"> (optional now — you can choose after verification)</span>}</Link>
            <em>{step.done ? 'Done' : step.required ? 'Required' : 'Optional'}</em>
          </li>)}
        </ol>
      </section>

      {/* ---- Documents ------------------------------------------------ */}
      <section className="card" id="documents">
        <h2>Verification documents</h2>
        <p className="muted">{isCompany
          ? 'Companies and institutions must provide a business registration certificate and an identity document for the authorised representative.'
          : 'Individual participants provide an identity document — passport, national ID or driver’s licence.'}</p>
        {(documents ?? []).length > 0 && <div className="history-list">{(documents ?? []).map(doc => <div key={doc.id}>
          <strong>{doc.file_name}</strong><span>{date(doc.created_at)}</span>
          <p className="muted">{humanize(doc.purpose)}</p>
        </div>)}</div>}
        <form action={uploadDocument} className="form-stack" encType="multipart/form-data">
          <input type="hidden" name="returnTo" value="/dashboard/verification" />
          <input type="hidden" name="accessScope" value="private" />
          <div className="form-grid">
            <label>Document type
              <select name="purpose" defaultValue={!hasIdentity ? 'identity' : isCompany && !hasCertificate ? 'business_certificate' : 'profile'} required>
                <option value="identity">Identity document (passport, national ID, licence)</option>
                {isCompany && <option value="business_certificate">Business registration certificate</option>}
                <option value="profile">Company profile or supporting document</option>
              </select>
            </label>
            <label>File<input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.docx" /></label>
          </div>
          <p className="field-help">PDF, PNG, JPEG or DOCX, up to 25MB. Only you and WTC Accra can open these.</p>
          <SubmitButton pendingLabel="Uploading…">Upload document</SubmitButton>
        </form>
      </section>

      {/* ---- Plan ------------------------------------------------------ */}
      <section className="card" id="plan">
        <h2>Choose your plan</h2>
        <p className="muted">Plans are matched to your participant type. Free plans activate as soon as you are verified; paid plans unlock the marketplace once payment is received. You can change this later.</p>
        <form action={choosePlan} className="form-stack">
          <div className="plan-grid">
            {eligiblePlans.map(plan => <label className={`card plan-card plan-option${chosenPlan?.code === plan.code ? ' plan-current' : ''}`} key={plan.code}>
              <input type="radio" name="planCode" value={plan.code} defaultChecked={chosenPlan?.code === plan.code} />
              <span className="eyebrow">{plan.name}</span>
              <strong className="plan-price">{plan.price_usd === 0 ? 'Free' : money(plan.price_usd)}{plan.price_usd > 0 && <small>/{plan.billing_interval}</small>}</strong>
              <p className="muted">{plan.description}</p>
            </label>)}
          </div>
          <div className="button-row">
            <SubmitButton className="button button-secondary" pendingLabel="Saving…">Save plan choice</SubmitButton>
            {chosenPlan && <button className="button button-outline" type="submit" name="planCode" value="">Clear</button>}
          </div>
        </form>
      </section>

      {/* ---- Submit ---------------------------------------------------- */}
      <section className="card">
        <h2>Submit for review</h2>
        {!ready
          ? <p className="muted">Complete the required items above to enable submission.</p>
          : <form action={submitVerification} className="form-stack">
              <label>Note to the reviewer<textarea name="note" rows={4} placeholder="Optional context for WTC Accra — who you are, what you are looking for." /></label>
              <p className="field-help">By submitting you confirm the information and documents are accurate and that you are authorised to represent {isCompany ? 'the organisation' : 'yourself'} on this platform.</p>
              <SubmitButton pendingLabel="Submitting…">Submit for verification</SubmitButton>
            </form>}
      </section>
    </>}

    {requests && requests.length > 0 && <section className="card">
      <h2>Submission history</h2>
      <div className="history-list">{requests.map(request => <div key={request.id}>
        <strong>{humanize(request.status)}</strong>
        <span>{date(request.submitted_at)}</span>
        <p>{request.reviewer_note || request.submission_note || 'No notes'}</p>
      </div>)}</div>
    </section>}
  </div>
}
