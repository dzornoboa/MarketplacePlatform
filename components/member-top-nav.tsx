'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Profile } from '@/lib/database.types'
import { LogoLink } from '@/components/brand'
import { Avatar } from '@/components/avatar'
import { VerifiedCheck } from '@/components/verified-check'
import { SignOutButton } from '@/components/sign-out-button'

type Props = {
  profile: Profile
  unreadCount?: number
}

function NavIcon({ children }: { children: string }) {
  return <span className="member-top-icon" aria-hidden="true">{children}</span>
}

export function MemberTopNav({ profile, unreadCount = 0 }: Props) {
  const pathname = usePathname()
  const active = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`))
  const links = [
    { href: '/dashboard', label: 'Home', icon: '⌂' },
    { href: '/dashboard/network', label: 'My Network', icon: '◎' },
    { href: '/dashboard/opportunities', label: 'Listings', icon: '▣' },
    { href: '/dashboard/deal-rooms', label: 'Messages', icon: '✉' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: '●', badge: unreadCount },
  ]

  return <header className="member-top-nav">
    <div className="member-top-nav-inner">
      <div className="member-top-brand">
        <LogoLink href="/dashboard" />
        <form className="member-global-search" action="/dashboard/network" method="get">
          <span aria-hidden="true">⌕</span>
          <input name="q" type="search" placeholder="Search Members And Network" aria-label="Search members and network" />
        </form>
      </div>

      <nav className="member-top-links" aria-label="Member Dashboard">
        {links.map(link => <Link key={link.href} href={link.href} className={active(link.href) ? 'member-top-link member-top-link-active' : 'member-top-link'}>
          <span className="member-top-icon-wrap"><NavIcon>{link.icon}</NavIcon>{!!link.badge && link.badge > 0 && <span className="member-top-badge">{link.badge > 99 ? '99+' : link.badge}</span>}</span>
          <span>{link.label}</span>
        </Link>)}

        <details className="member-top-me">
          <summary className="member-top-link">
            <span className="member-top-avatar-wrap"><Avatar src={profile.avatar_url} name={profile.full_name} size={28} /><VerifiedCheck verified={profile.verification_status === 'verified'} size={12} /></span>
            <span>Me ▾</span>
          </summary>
          <div className="member-me-menu">
            <div className="member-me-identity">
              <Avatar src={profile.avatar_url} name={profile.full_name} size={46} />
              <div><strong>{profile.full_name || 'Member'}</strong><small>{profile.country || 'WTC Accra Hub'}</small></div>
            </div>
            <Link href="/dashboard/profile">View Profile</Link>
            <Link href="/dashboard/organisation">Organisation</Link>
            <Link href="/dashboard/billing">Membership And Billing</Link>
            <Link href="/dashboard/settings">Settings</Link>
            <Link href="/dashboard/support">Support</Link>
            <div className="member-me-signout"><SignOutButton /></div>
          </div>
        </details>
      </nav>
    </div>
  </header>
}
