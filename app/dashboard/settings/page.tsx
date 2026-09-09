import { requireUserProfile } from '@/lib/auth/guards'

export default async function SettingsPage() {
  const { profile } = await requireUserProfile()
  return <div className="page-stack narrow-content"><div><p className="eyebrow">Settings</p><h1>Account settings</h1><p className="muted">Manage your account preferences and review your current access state.</p></div><section className="card detail-grid"><div><dt>Verification</dt><dd>{profile.verification_status.replaceAll('_',' ')}</dd></div><div><dt>System role</dt><dd>{profile.system_role.replaceAll('_',' ')}</dd></div><div><dt>Approved type</dt><dd>{profile.participant_type?.replaceAll('_',' ') ?? 'Awaiting approval'}</dd></div><div><dt>Requested type</dt><dd>{profile.requested_participant_type?.replaceAll('_',' ') ?? 'Not selected'}</dd></div></section><section className="card"><h2>Security</h2><p className="muted">Password changes are handled through Supabase Auth. Administrators must complete MFA before opening administrative routes.</p></section></div>
}
