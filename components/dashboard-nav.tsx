'use client'

import { SignOutButton } from '@/components/sign-out-button'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { LogoLink } from '@/components/brand'
import { hasCapability, isAdminRole, isStaffRole } from '@/lib/auth/access'

type NavLink = { href: string; label: string; verifiedOnly?: boolean; badge?: number }

export function DashboardNav({ profile, unreadCount = 0, adminMfaReady = true, adminHasFactor = false }: { profile: Profile; unreadCount?: number; adminMfaReady?: boolean; adminHasFactor?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  /* On a phone the sidebar is a collapsed menu. Closing it on navigation means
     a tap always lands on the page, not on a menu still covering it. */
  useEffect(() => { setOpen(false) }, [pathname])
  const asideRef = useRef<HTMLElement>(null)
  // Tap outside the menu, or press Escape, and it closes.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => { if (asideRef.current && !asideRef.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
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
        { href: '/opportunities', label: 'Live listings' },
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

  return <>{open && <div className="sidebar-backdrop" aria-hidden="true" />}<aside ref={asideRef} className={open ? 'dashboard-sidebar sidebar-open' : 'dashboard-sidebar'}>
    <div className="sidebar-top">
      <LogoLink href="/dashboard" />
      <div className="sidebar-top-actions"><SignOutButton className="button button-outline signout-button signout-top" />
      <button className="sidebar-toggle" type="button" aria-expanded={open} aria-controls="dashboard-nav" onClick={() => setOpen(v => !v)}>
        <span className="burger" aria-hidden="true" />
        <span className="sidebar-toggle-label">{open ? 'Close' : 'Menu'}</span>
        {!open && unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button></div>
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
        {editor && <Link className={isActive('/editor') ? 'nav-active nav-console' : 'nav-console'} href={adminMfaReady ? '/editor' : '/dashboard/security?required=admin-mfa&next=%2Feditor'}>
          <span>Editor console</span>{!adminMfaReady && <span className="nav-badge">{adminHasFactor ? 'Enter code' : 'Set up MFA'}</span>}
        </Link>}
        {admin && <Link className={isActive('/admin') ? 'nav-active nav-console' : 'nav-console'} href={adminMfaReady ? '/admin' : '/dashboard/security?required=admin-mfa&next=%2Fadmin'}>
          <span>Administration</span>{!adminMfaReady && <span className="nav-badge">{adminHasFactor ? 'Enter code' : 'Set up MFA'}</span>}
        </Link>}
      </div>}
    </nav>
    <div className="sidebar-bottom">
      <span className={`status-dot status-${profile.verification_status}`}>{profile.verification_status.replaceAll('_', ' ')}</span>
      <SignOutButton />
    </div>
  </aside></>
}
