import { requireUserProfile, readAccessState } from '@/lib/auth/guards'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { selectableParticipantTypes, participantTypeLabels } from '@/lib/auth/access'
import { updateProfile, uploadAvatar, removeAvatar } from './actions'
import { Avatar } from '@/components/avatar'
import { SubmitButton } from '@/components/submit-button'
import { ProfileRegionFields } from '@/components/profile-region-fields'
import { ProfileBirthDateFields } from '@/components/profile-birth-date-fields'

const ID_TYPES = [
  ['passport', 'Passport'],
  ['drivers_license', "Driver's Licence"],
  ['voter_id', 'Voter ID'],
  ['residence_permit', 'Residence Permit'],
  ['national_id', 'National ID'],
  ['other', 'Other Government-Issued ID'],
] as const

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
  return <div className="page-stack narrow-content"><div><p className="eyebrow">Account profile</p><h1>Profile and participant details<VerifiedCheck verified={profile.verification_status === 'verified'} size={20} /></h1><p className="avatar-stack"><ParticipantBadge type={profile.participant_type} requested={profile.requested_participant_type} size="md" /><span className="plan-tag plan-tag-md">{planLine}</span> <a className="arrow-link" href="/dashboard/billing">Billing →</a></p><p className="muted">Complete this information before requesting WTC Accra verification.</p></div>{error && <div className="alert alert-error">{error}</div>}{message && <div className="alert alert-success">{message}</div>}<section className="card"><h2>Profile photo</h2><p className="muted">Shown on your listings, bids, the member directory and deal rooms.</p><div className="avatar-upload"><Avatar src={profile.avatar_url} name={profile.full_name} size={96} /><form action={uploadAvatar} className="form-stack"><label>New photo<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" required /></label><p className="field-help">JPG, PNG or WebP, up to 5MB. Square images look best.</p><div className="button-row"><SubmitButton pendingLabel="Uploading…">Upload photo</SubmitButton>{profile.avatar_url && <button className="button button-outline" formAction={removeAvatar} type="submit">Remove</button>}</div></form></div></section><form action={updateProfile} className="card form-stack"><h2>Personal And Verification Details</h2><div className="form-grid"><label>Full Name<input name="fullName" defaultValue={profile.full_name} required /></label><label>Username<input name="username" defaultValue={profile.username ?? ''} required minLength={3} maxLength={30} pattern="[a-z0-9][a-z0-9._-]{2,29}" /></label></div><p className="field-help">Your full name does not need to be unique. Your username is the unique handle used to distinguish members with similar names.</p><ProfileRegionFields country={profile.country} countryCode={profile.country_code} phone={profile.phone} phoneCountryCode={profile.phone_country_code} preferredCurrency={profile.preferred_currency} /><label>Job Title<input name="jobTitle" defaultValue={profile.job_title ?? ''} /></label><label>City<input name="city" defaultValue={profile.city ?? ''} /></label><ProfileBirthDateFields initialValue={profile.date_of_birth} /><div className="form-grid"><label>Identification Type<select name="idType" defaultValue={profile.id_type ?? ''} required><option value="" disabled>Select Identification Type</option>{ID_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Identification Number<input name="idNumber" defaultValue={profile.id_number ?? ''} required minLength={3} maxLength={80} autoComplete="off" /></label></div><p className="field-help">Date of birth and identification details are used only for eligibility, identity verification and compliance review. They are not shown in the public member directory or listings.</p><label>Participant Type<select name="participantType" defaultValue={profile.requested_participant_type ?? ''} disabled={lockedType} required><option value="" disabled>Select Account Type</option>{selectableParticipantTypes.map(type => <option key={type} value={type}>{participantTypeLabels[type]}</option>)}</select></label>{lockedType && <p className="field-help">Your approved participant type is locked. WTC Accra must review any membership-type change.</p>}<button className="button button-primary" type="submit">Save Profile</button></form></div>
}
