import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'
import { updateProfile, uploadAvatar, removeAvatar } from './actions'
import { Avatar } from '@/components/avatar'
import { SubmitButton } from '@/components/submit-button'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }
export default async function ProfilePage({ searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile(); const params = await searchParams
  const state = await readAccessState(supabase)
  const fee = state?.subscription_fee ? ` · US${Number(state.subscription_fee).toLocaleString()}/year` : ''
  const planLine = state?.has_active_subscription && state?.subscription_plan_name
    ? `${state.subscription_plan_name} membership${fee} · renews ${state.subscription_ends_at ? new Date(state.subscription_ends_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}`
    : state?.subscription_status === 'pending' ? `${state.subscription_plan_name ?? 'Membership'}${fee} · payment due`
    : state?.subscription_status === 'awaiting_approval' ? `${state.subscription_plan_name ?? 'Membership'} · awaiting WTC Accra approval`
    : state?.subscription_status === 'expired' ? `${state.subscription_plan_name ?? 'Membership'} · expired` : 'No membership yet'
  const error = typeof params.error === 'string' ? params.error : null; const message = typeof params.message === 'string' ? params.message : null
  const lockedType = profile.verification_status === 'verified'
  return <div className="page-stack narrow-content"><div><p className="eyebrow">Account profile</p><h1>Profile and participant details<VerifiedCheck verified={profile.verification_status === 'verified'} size={20} /></h1><p className="avatar-stack"><ParticipantBadge type={profile.participant_type} requested={profile.requested_participant_type} size="md" /><span className="plan-tag plan-tag-md">{planLine}</span> <a className="arrow-link" href="/dashboard/billing">Billing →</a></p><p className="muted">Complete this information before requesting WTC Accra verification.</p></div>{error && <div className="alert alert-error">{error}</div>}{message && <div className="alert alert-success">{message}</div>}<section className="card"><h2>Profile photo</h2><p className="muted">Shown on your listings, bids, the member directory and deal rooms.</p><div className="avatar-upload"><Avatar src={profile.avatar_url} name={profile.full_name} size={96} /><form action={uploadAvatar} className="form-stack"><label>New photo<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" required /></label><p className="field-help">JPG, PNG or WebP, up to 5MB. Square images look best.</p><div className="button-row"><SubmitButton pendingLabel="Uploading…">Upload photo</SubmitButton>{profile.avatar_url && <button className="button button-outline" formAction={removeAvatar} type="submit">Remove</button>}</div></form></div></section><form action={updateProfile} className="card form-stack"><label>Full name<input name="fullName" defaultValue={profile.full_name} required /></label><div className="form-grid"><label>Phone<input name="phone" defaultValue={profile.phone ?? ''} /></label><label>Job title<input name="jobTitle" defaultValue={profile.job_title ?? ''} /></label></div><div className="form-grid"><label>Country<input name="country" defaultValue={profile.country ?? ''} /></label><label>City<input name="city" defaultValue={profile.city ?? ''} /></label></div><label>Participant type<select name="participantType" defaultValue={profile.requested_participant_type ?? ''} disabled={lockedType} required><option value="" disabled>Select account type</option>{selectableParticipantTypes.map(type => <option key={type} value={type}>{participantTypeLabels[type]}</option>)}</select></label>{lockedType && <p className="field-help">Your approved participant type is locked. WTC Accra must review any membership-type change.</p>}<button className="button button-primary" type="submit">Save profile</button></form></div>
}
