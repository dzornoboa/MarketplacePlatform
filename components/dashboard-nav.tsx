'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { LogoLink } from '@/components/brand'

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/verification', label: 'Verification' },
  { href: '/dashboard/opportunities', label: 'Opportunities', verifiedOnly: true },
  { href: '/dashboard/security', label: 'Security' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/support', label: 'Support' },
]

export function DashboardNav({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const verified = profile.verification_status === 'verified'
  const admin = profile.system_role === 'admin' || profile.system_role === 'super_admin'
  const classFor = (href: string, extra?: string) => [pathname === href ? 'nav-active' : '', extra ?? ''].filter(Boolean).join(' ')
  return <aside className="dashboard-sidebar"><LogoLink href="/dashboard" /><p className="sidebar-label">Member workspace</p><nav>{LINKS.map(link => <Link key={link.href} className={classFor(link.href, link.verifiedOnly && !verified ? 'nav-locked' : undefined)} aria-current={pathname === link.href ? 'page' : undefined} href={link.href}>{link.label} {link.verifiedOnly && !verified && '🔒'}</Link>)}{admin && <Link className="nav-admin" href="/admin">Administration</Link>}</nav><div className="sidebar-bottom"><span className={`status-dot status-${profile.verification_status}`}>{profile.verification_status.replaceAll('_', ' ')}</span><form action="/auth/signout" method="post"><button className="link-button" type="submit">Sign out</button></form></div></aside>
}
