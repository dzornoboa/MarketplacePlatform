'use client'

import { SignOutButton } from '@/components/sign-out-button'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { LogoLink } from '@/components/brand'
import { Avatar } from '@/components/avatar'
import { ParticipantBadge } from '@/components/participant-badge'
import { VerifiedCheck } from '@/components/verified-check'
import { hasCapability, isAdminRole, isStaffRole } from '@/lib/auth/access'

type NavLink = { href: string; label: string; verifiedOnly?: boolean; badge?: number; note?: string }
export type DashboardNavGroup = { label: string; links: NavLink[] }

export function DashboardNav({ profile, unreadCount = 0, adminMfaReady = true, adminHasFactor = false, hasAccess = false, planLabel = null, consoleGroups }: { profile: Profile; unreadCount?: number; adminMfaReady?: boolean; adminHasFactor?: boolean; hasAccess?: boolean; planLabel?: string | null; consoleGroups?: DashboardNavGroup[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const groupId = useId()

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
  const admin = isAdminRole(profile.system_role)
  const editor = hasCapability(profile.system_role, 'content')
  const staff = isStaffRole(profile.system_role)

  const groups: DashboardNavGroup[] = consoleGroups ?? [
    {
      label: 'Marketplace',
      links: [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/feed', label: 'Home Feed' },
        { href: '/opportunities', label: 'Live Listings' },
        { href: '/dashboard/network', label: 'Network', verifiedOnly: true },
        { href: '/dashboard/opportunities', label: 'Opportunities', verifiedOnly: true },
        { href: '/dashboard/matches', label: 'Matches', verifiedOnly: true },
        { href: '/dashboard/saved', label: 'Saved', verifiedOnly: true },
        { href: '/dashboard/interests', label: 'Deals', verifiedOnly: true },
        { href: '/dashboard/introductions', label: 'Introductions', verifiedOnly: true },
        { href: '/dashboard/deal-rooms', label: 'Deal Rooms', verifiedOnly: true },
        { href: '/dashboard/notifications', label: 'Notifications', badge: unreadCount },
        { href: '/dashboard/reports', label: 'Reports' },
      ],
    },
    {
      label: 'Your Business',
      links: [
        { href: '/dashboard/organisation', label: 'Organisation' },
        { href: '/dashboard/mandate', label: 'Mandate And Requirements', verifiedOnly: true },
        { href: '/dashboard/documents', label: 'Documents', verifiedOnly: true },
      ],
    },
    {
      label: 'Account',
      links: [
        { href: '/dashboard/profile', label: 'Profile' },
        { href: '/dashboard/verification', label: 'Verification' },
        { href: '/dashboard/billing', label: 'Billing And Membership' },
        { href: '/dashboard/security', label: 'Security' },
        { href: '/dashboard/settings', label: 'Settings' },
        { href: '/dashboard/support', label: 'Support' },
      ],
    },
  ]

  if (!consoleGroups && staff) {
    const note = admin && !adminMfaReady ? (adminHasFactor ? 'Enter code' : 'Set up MFA') : undefined
    const consoleHref = (href: string) => note ? `/dashboard/security?required=admin-mfa&next=${encodeURIComponent(href)}` : href
    groups.push({
      label: 'Staff Access',
      links: [
        { href: consoleHref('/admin'), label: admin ? 'Administration' : 'Staff Console', note },
        ...(editor ? [{ href: consoleHref('/editor'), label: 'Editor Console', note }] : []),
      ],
    })
  }

  const overview = consoleGroups ? '/admin' : '/dashboard'
  const isActive = (href: string) => {
    const path = href.split('?')[0]
    return pathname === path || (path !== '/dashboard' && path !== '/admin' && pathname.startsWith(`${path}/`))
  }

  return <>{open && <div className="sidebar-backdrop" aria-hidden="true" />}<aside ref={asideRef} className={open ? 'dashboard-sidebar sidebar-open' : 'dashboard-sidebar'}>
    <div className="sidebar-top">
      <LogoLink href={overview} />
      <div className="sidebar-top-actions"><SignOutButton className="button button-outline signout-button signout-top" />
      <button className="sidebar-toggle" type="button" aria-expanded={open} aria-controls="dashboard-nav" onClick={() => setOpen(v => !v)}>
        <span className="burger" aria-hidden="true" />
        <span className="sidebar-toggle-label">{open ? 'Close' : 'Menu'}</span>
        {!open && unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button></div>
    </div>
    <Link className="sidebar-user" href="/dashboard/profile"><Avatar src={profile.avatar_url} name={profile.full_name} size={36} /><span><strong>{profile.full_name || 'Your Profile'}<VerifiedCheck verified={profile.verification_status === 'verified'} size={14} /></strong><small>{staff ? 'WTC Accra Staff · WTC Accra Member' : 'Member Workspace'}</small>{staff ? <span className="plan-tag">{profile.system_role.replaceAll('_',' ')}</span> : <ParticipantBadge type={profile.participant_type} requested={profile.requested_participant_type} />}{!staff && planLabel && <span className="plan-tag">{planLabel}</span>}</span></Link>
    <nav id="dashboard-nav" aria-label={consoleGroups ? 'Staff console' : 'Dashboard'}>
      <Link href={overview} className={isActive(overview) ? 'nav-active' : undefined} aria-current={isActive(overview) ? 'page' : undefined}>Overview</Link>
      {groups.map((group, index) => {
        const links = group.links.filter(link => link.href !== overview)
        if (!links.length) return null
        const isOpen = expanded === group.label
        const active = links.some(link => !link.note && isActive(link.href))
        const panel = `${groupId}-${index}`
        const badge = links.reduce((count, link) => count + (link.badge ?? 0), 0)
        return <div className="nav-group nav-disclosure" key={group.label}>
          <button className={active ? 'nav-section-button nav-section-current' : 'nav-section-button'} type="button" aria-expanded={isOpen} aria-controls={panel} onClick={() => setExpanded(group.label)}>
            <span>{group.label}</span>
            {!isOpen && badge > 0 && <span className="nav-badge" aria-label={`${badge} unread notifications`}>{badge > 99 ? '99+' : badge}</span>}
            <span className="nav-section-chevron" aria-hidden="true" />
          </button>
          <div id={panel} className="nav-section-links" hidden={!isOpen}>
            {links.map(link => {
              const locked = link.verifiedOnly && !hasAccess && !staff
              const current = !link.note && isActive(link.href)
              return <Link key={link.href}
                className={[current ? 'nav-active' : '', locked ? 'nav-locked' : ''].filter(Boolean).join(' ')}
                aria-current={current ? 'page' : undefined} href={link.href}
                onClick={() => setOpen(false)}>
                <span>{link.label}</span>
                {locked && <span aria-label="Locked">🔒</span>}
                {!locked && !!link.badge && <span className="nav-badge">{link.badge > 99 ? '99+' : link.badge}</span>}
                {link.note && <span className="nav-badge">{link.note}</span>}
              </Link>
            })}
          </div>
        </div>
      })}
    </nav>
    <div className="sidebar-bottom">
      {consoleGroups && <Link href="/dashboard">Member dashboard</Link>}
      <Link href="/dashboard/search">Search the hub</Link>
      <Link href="/">Back to website</Link>
      <span className={`status-dot status-${profile.verification_status}`}>{profile.verification_status === 'verified' ? 'Verified check' : profile.verification_status.replaceAll('_', ' ')}</span>
      <SignOutButton />
    </div>
  </aside></>
}
