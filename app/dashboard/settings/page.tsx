import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize, labelForParticipantType, systemRoleLabels } from '@/lib/auth/access'
import { date } from '@/lib/format'
import { PushNotificationToggle } from '@/components/push-notification-toggle'
import { updatePreferences } from './actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const TOGGLES = [
  { name: 'emailNotifications', column: 'email_notifications', label: 'Email notifications', help: 'Master switch. Turning this off stops all non-essential email.' },
  { name: 'opportunityUpdates', column: 'opportunity_updates', label: 'Opportunity updates', help: 'Review decisions on your listings, and interest received.' },
  { name: 'introductionUpdates', column: 'introduction_updates', label: 'Introductions and connections', help: 'Connection requests, responses and introductions arranged by the trade desk.' },
  { name: 'membershipUpdates', column: 'membership_updates', label: 'Membership and billing', help: 'Verification, membership and subscription changes.' },
  { name: 'marketingEmails', column: 'marketing_emails', label: 'News and events', help: 'WTC Accra news, resources and event invitations.' },
] as const

export default async function SettingsPage({ searchParams }: Props) {
  const { supabase, profile, claims } = await requireUserProfile()
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const message = typeof params.message === 'string' ? params.message : null

  const { data: preferences } = await supabase.from('user_preferences').select('*').maybeSingle()
  const value = (column: string, fallback: boolean) =>
    preferences ? Boolean((preferences as unknown as Record<string, unknown>)[column]) : fallback

  return <div className="page-stack narrow-content">
    <div>
      <p className="eyebrow">Settings</p>
      <h1>Account settings</h1>
      <p className="muted">Your access state, and how WTC Accra contacts you.</p>
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}

    <section className="card">
      <h2>Your access</h2>
      <p className="muted">Set by WTC Accra. Contact support if something looks wrong.</p>
      <dl className="detail-grid detail-grid-two">
        <div><dt>Email</dt><dd>{String(claims.email ?? '—')}</dd></div>
        <div><dt>Account status</dt><dd>{humanize(profile.account_status)}</dd></div>
        <div><dt>Verification</dt><dd>{humanize(profile.verification_status)}</dd></div>
        <div><dt>Role</dt><dd>{systemRoleLabels[profile.system_role] ?? profile.system_role}</dd></div>
        <div><dt>Approved type</dt><dd>{labelForParticipantType(profile.participant_type)}</dd></div>
        <div><dt>Requested type</dt><dd>{labelForParticipantType(profile.requested_participant_type)}</dd></div>
        <div><dt>Browse marketplace</dt><dd>{profile.can_view_opportunities ? 'Allowed' : 'Paused by WTC Accra'}</dd></div>
        <div><dt>Post listings</dt><dd>{profile.can_post_opportunities ? 'Allowed' : 'Paused by WTC Accra'}</dd></div>
        <div><dt>Member since</dt><dd>{date(profile.created_at)}</dd></div>
      </dl>
    </section>

    <form action={updatePreferences} className="card form-stack">
      <h2>Notifications</h2>
      <p className="muted">In-app notifications always arrive. These control email only.</p>
      <div className="switch-row">
        {TOGGLES.map(toggle => <label className="switch preference-row" key={toggle.name}>
          <input type="checkbox" name={toggle.name} defaultChecked={value(toggle.column, toggle.column !== 'marketing_emails')} />
          <span><strong>{toggle.label}</strong><small>{toggle.help}</small></span>
        </label>)}
      </div>

      <div className="form-grid">
        <label>Timezone<input name="timezone" defaultValue={preferences?.timezone ?? 'Africa/Accra'} required /></label>
        <label>Locale<input name="locale" defaultValue={preferences?.locale ?? 'en-GH'} required /></label>
      </div>
      <p className="field-help">Used for dates and times shown across the platform.</p>
      <button className="button button-primary" type="submit">Save preferences</button>
    </form>

    <PushNotificationToggle />

    <section className="card">
      <h2>Security</h2>
      <p className="muted">Passwords and two-factor authentication are managed separately. Administrators must complete MFA before opening administrative routes.</p>
      <div className="button-row">
        <Link className="button button-secondary" href="/dashboard/security">Security settings</Link>
        <Link className="button button-outline" href="/dashboard/profile">Edit profile</Link>
      </div>
    </section>
  </div>
}
