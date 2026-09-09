import { requireVerifiedProfile } from '@/lib/auth/guards'

export default async function OpportunitiesPage() {
  const { profile } = await requireVerifiedProfile()
  return <div className="page-stack"><div><p className="eyebrow">Private marketplace</p><h1>Opportunities</h1><p className="muted">Access confirmed for {profile.participant_type?.replaceAll('_',' ')}.</p></div><section className="card empty-state"><span>🔐</span><h2>Opportunity module ready for the next build phase</h2><p>The route is now authentication- and verification-protected. We will connect curated opportunities, matching and deal rooms here next.</p></section></div>
}
