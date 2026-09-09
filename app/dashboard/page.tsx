import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { dashboardRestrictionReason } from '@/lib/auth/access'

export default async function DashboardPage() {
  const { profile, claims } = await requireUserProfile()
  const restriction = dashboardRestrictionReason(profile.verification_status)
  const displayName = profile.full_name || String(claims.email ?? 'Member')
  return <div className="page-stack"><div><p className="eyebrow">Member dashboard</p><h1>Welcome, {displayName}</h1><p className="muted">Your WTC Accra business network workspace.</p></div>{restriction && <section className="restriction-banner"><div><strong>Opportunity access is restricted</strong><p>{restriction}</p></div><Link className="button button-light" href={profile.verification_status === 'pending_profile' ? '/dashboard/profile' : '/dashboard/verification'}>Continue verification</Link></section>}<section className="dashboard-grid"><article className="metric-card"><span>Verification</span><strong>{profile.verification_status.replaceAll('_', ' ')}</strong><p>{profile.verification_status === 'verified' ? 'Private marketplace access enabled.' : 'Verification is required for private opportunities.'}</p></article><article className="metric-card"><span>Participant type</span><strong>{profile.participant_type?.replaceAll('_', ' ') ?? 'Awaiting approval'}</strong><p>Requested: {profile.requested_participant_type?.replaceAll('_', ' ') ?? 'Not selected'}</p></article><article className="metric-card"><span>Opportunities</span><strong>{profile.verification_status === 'verified' ? 'Available' : 'Locked'}</strong><p>Opportunity records are never exposed publicly.</p></article></section></div>
}
