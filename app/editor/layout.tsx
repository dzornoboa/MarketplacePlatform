import { SignOutButton } from '@/components/sign-out-button'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { systemRoleLabels } from '@/lib/auth/access'
import { LogoLink } from '@/components/brand'
import { NavLinks } from '@/components/nav-links'

export const dynamic = 'force-dynamic'

const EDITOR_LINKS = [
  { href: '/editor', label: 'Overview' },
  { href: '/editor/news', label: 'News and resources' },
  { href: '/editor/builder', label: 'Website builder' },
  { href: '/editor/pages', label: 'Page sections (form view)' },
  { href: '/editor/settings', label: 'Settings and navigation' },
  { href: '/dashboard', label: 'Member dashboard' },
]

export default async function EditorLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireCapability('content')
  return <div className="admin-shell">
    <header className="admin-header admin-header-editor">
      <div>
        <LogoLink href="/dashboard" />
        <span className="admin-label admin-label-editor">Editor</span>
      </div>
      <nav><NavLinks items={EDITOR_LINKS} /></nav>
      <details className="mobile-menu console-menu">
        <summary aria-label="Open menu"><span className="burger" aria-hidden="true" /></summary>
        <div className="mobile-menu-panel">
          <nav><NavLinks items={EDITOR_LINKS} /></nav>
          <div className="mobile-menu-actions"><Link className="button button-outline" href="/dashboard">Member dashboard</Link><SignOutButton /></div>
        </div>
      </details>
      <span className="console-user">{profile.full_name} · {systemRoleLabels[profile.system_role] ?? profile.system_role}</span>
      <div className="console-signout"><SignOutButton /></div>
    </header>
    <main className="admin-main">{children}</main>
  </div>
}
