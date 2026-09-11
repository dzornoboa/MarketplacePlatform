'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { LogoLink } from '@/components/brand'
import { hasCapability, isAdminRole, isStaffRole } from '@/lib/auth/access'

type NavLink = { href: string; label: string; verifiedOnly?: boolean; badge?: number }

export function DashboardNav({ profile, unreadCount = 0 }: { profile: Profile; unreadCount?: number }) {
  const pathname = usePathname()
  const verified = profile.verification_status === 'verified'
  const admin = isAdminRole(profile.system_role)
  const editor = hasCapability(profile.system_role, 'content')
  const staff = isStaffRole(profile.system_role)

  const groups: { label: string; links: NavLink[] }[] = [
    {
      label: 'Marketplace',
      links: [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/opportunities', label: 'Opportunities', verifiedOnly: true },
        { href: '/dashboard/matches', label: 'Matches', verifiedOnly: true },
        { href: '/dashboard/interests', label: 'Expressions of interest', verifiedOnly: true },
        { href: '/dashboard/introductions', label: 'Introductions', verifiedOnly: true },
        { href: '/dashboard/notifications', label: 'Notifications', badge: unreadCount },
      ],
    },
    {
      label: 'Your business',
      links: [
        { href: '/dashboard/organisation', label: 'Organisation' },
        { href: '/dashboard/mandate', label: 'Mandate and requirements', verifiedOnly: true },
        { href: '/dashboard/documents', label: 'Documents', verifiedOnly: true },
      ],
    },
    {
      label: 'Account',
      links: [
        { href: '/dashboard/profile', label: 'Profile' },
        { href: '/dashboard/verification', label: 'Verification' },
        { href: '/dashboard/billing', label: 'Billing and membership' },
        { href: '/dashboard/security', label: 'Security' },
        { href: '/dashboard/settings', label: 'Settings' },
        { href: '/dashboard/support', label: 'Support' },
      ],
    },
  ]

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))

  return <aside className="dashboard-sidebar">
    <LogoLink href="/dashboard" />
    <p className="sidebar-label">{staff ? 'Staff workspace' : 'Member workspace'}</p>
    <nav>
      {groups.map(group => <div className="nav-group" key={group.label}>
        <p className="nav-group-label">{group.label}</p>
        {group.links.map(link => {
          const locked = link.verifiedOnly && !verified
          return <Link
            key={link.href}
            className={[isActive(link.href) ? 'nav-active' : '', locked ? 'nav-locked' : ''].filter(Boolean).join(' ')}
            aria-current={isActive(link.href) ? 'page' : undefined}
            href={link.href}>
            <span>{link.label}</span>
            {locked && <span aria-label="Locked">🔒</span>}
            {!locked && !!link.badge && link.badge > 0 && <span className="nav-badge">{link.badge > 99 ? '99+' : link.badge}</span>}
          </Link>
        })}
      </div>)}

      {(admin || editor) && <div className="nav-group">
        <p className="nav-group-label">Console</p>
        {editor && <Link className={isActive('/editor') ? 'nav-active nav-console' : 'nav-console'} href="/editor">Editor console</Link>}
        {admin && <Link className={isActive('/admin') ? 'nav-active nav-console' : 'nav-console'} href="/admin">Administration</Link>}
      </div>}
    </nav>
    <div className="sidebar-bottom">
      <span className={`status-dot status-${profile.verification_status}`}>{profile.verification_status.replaceAll('_', ' ')}</span>
      <form action="/auth/signout" method="post"><button className="link-button" type="submit">Sign out</button></form>
    </div>
  </aside>
}
