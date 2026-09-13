import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireStaffConsole } from '@/lib/auth/guards'
import { hasCapability, isAdminRole, systemRoleLabels } from '@/lib/auth/access'
import { LogoLink } from '@/components/brand'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireStaffConsole()
  const role = profile.system_role
  const links = [
    { href: '/admin', label: 'Overview', show: true },
    { href: '/admin/super', label: 'Super admin', show: role === 'super_admin' },
    { href: '/admin/verification', label: 'Verification queue', show: hasCapability(role, 'verification') },
    { href: '/admin/users', label: 'Members', show: isAdminRole(role) },
    { href: '/admin/opportunities', label: 'Opportunities', show: hasCapability(role, 'opportunities') },
    { href: '/admin/bids', label: 'Bids', show: hasCapability(role, 'opportunities') },
    { href: '/admin/subscriptions', label: 'Subscriptions', show: hasCapability(role, 'finance') },
    { href: '/admin/support', label: 'Support', show: hasCapability(role, 'support') },
    { href: '/admin/emails', label: 'Email queue', show: isAdminRole(role) },
    { href: '/admin/audit', label: 'Audit log', show: isAdminRole(role) },
  ].filter(link => link.show)

  return <div className="admin-shell">
    <header className="admin-header">
      <div>
        <LogoLink href="/dashboard" />
        <span className="admin-label">{isAdminRole(role) ? 'Administration' : 'Staff console'}</span>
      </div>
      <nav>{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <details className="mobile-menu console-menu">
        <summary aria-label="Open menu"><span className="burger" aria-hidden="true" /></summary>
        <div className="mobile-menu-panel">
          <nav>{links.map(link => <Link key={`m-${link.href}`} href={link.href}>{link.label}</Link>)}</nav>
          <div className="mobile-menu-actions"><Link className="button button-outline" href="/dashboard">Member dashboard</Link></div>
        </div>
      </details>
      <span>{profile.full_name} · {systemRoleLabels[role] ?? role}</span>
    </header>
    <main className="admin-main">{children}</main>
  </div>
}
