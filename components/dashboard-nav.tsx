import Link from 'next/link'
import type { Profile } from '@/lib/database.types'

export function DashboardNav({ profile }: { profile: Profile }) {
  const verified = profile.verification_status === 'verified'
  const admin = profile.system_role === 'admin' || profile.system_role === 'super_admin'
  return <aside className="dashboard-sidebar"><Link className="brand" href="/dashboard">WTC ACCRA <span>Hub</span></Link><nav><Link href="/dashboard">Overview</Link><Link href="/dashboard/profile">Profile</Link><Link href="/dashboard/verification">Verification</Link><Link className={!verified ? 'nav-locked' : ''} href="/dashboard/opportunities">Opportunities {!verified && '🔒'}</Link><Link href="/dashboard/security">Security</Link><Link href="/dashboard/settings">Settings</Link><Link href="/dashboard/support">Support</Link>{admin && <Link href="/admin">Administration</Link>}</nav><div className="sidebar-bottom"><span className={`status-dot status-${profile.verification_status}`}>{profile.verification_status.replaceAll('_', ' ')}</span><form action="/auth/signout" method="post"><button className="link-button" type="submit">Sign out</button></form></div></aside>
}
