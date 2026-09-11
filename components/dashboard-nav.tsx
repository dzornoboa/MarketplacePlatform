'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { LogoLink } from '@/components/brand'
import { hasCapability, isAdminRole, isStaffRole } from '@/lib/auth/access'

type NavLink = { href: string; label: string; verifiedOnly?: boolean; badge?: number }

export function DashboardNav({ profile, unreadCount = 0 }: { profile: Profile; unreadCount?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  /* On a phone the sidebar is a collapsed menu. Closing it on navigation means
     a tap always lands on the page, not on a menu still covering it. */
  useEffect(() => { setOpen(false) }, [pathname])
  const verified = profile.verification_status === 'verified'
  const admin = isAdminRole(profile.system_role)
  const editor = hasCapability(profile.system_role, 'content')
  const staff = isStaffRole(profile.system_role)

  const groups: { label: string; links: NavLink[] }[] = [
    {
      label: 'Marketplace',
      links: [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/feed', label: 'Home feed' },
        { href: '/dashboard/network', label: 'Network', verifiedOnly: true },
        { href: '/dashboard/opportunities', label: 'Opportunities', verifiedOnly: true },
        { href: '/dashboard/matches', label: 'Matches', verifiedOnly: true },
        { href: '/dashboard/saved', label: 'Saved', verifiedOnly: true },
        { href: '/dashboard/interests', label: 'Expressions of interest', verifiedOnly: true },
        { href: '/dashboard/introductions', label: 'Introductions', verifiedOnly: true },
        { href: '/dashboard/deal-rooms', label: 'Deal rooms', verifiedOnly: true },
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

  return <aside className={open ? 'dashboard-sidebar sidebar-open' : 'dashboard-sidebar'}>
    <div className="sidebar-top">
      <LogoLink href="/dashboard" />
      <button className="sidebar-toggle" type="button" aria-expanded={open} aria-controls="dashboard-nav" onClick={() => setOpen(v => !v)}>
        <span className="burger" aria-hidden="true" />
        <span className="sidebar-toggle-label">{open ? 'Close' : 'Menu'}</span>
        {!open && unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
    </div>
    <p className="sidebar-label">{staff ? 'Staff workspace' : 'Member workspace'}</p>
    <nav id="dashboard-nav">
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
