import type { ReactNode } from 'react'
import Link from 'next/link'
import { requireCapability } from '@/lib/auth/guards'
import { systemRoleLabels } from '@/lib/auth/access'
import { LogoLink } from '@/components/brand'

export const dynamic = 'force-dynamic'

export default async function EditorLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireCapability('content')
  return <div className="admin-shell">
    <header className="admin-header admin-header-editor">
      <div>
        <LogoLink href="/dashboard" />
        <span className="admin-label admin-label-editor">Editor</span>
      </div>
      <nav>
        <Link href="/editor">Overview</Link>
        <Link href="/editor/news">News and resources</Link>
        <Link href="/editor/pages">Page sections</Link><Link href="/editor/settings">Settings and navigation</Link>
        <Link href="/dashboard">Member dashboard</Link>
      </nav>
      <details className="mobile-menu console-menu">
        <summary aria-label="Open menu"><span className="burger" aria-hidden="true" /></summary>
        <div className="mobile-menu-panel">
          <nav>
            <Link href="/editor">Overview</Link>
            <Link href="/editor/news">News and resources</Link>
            <Link href="/editor/pages">Page sections</Link>
            <Link href="/editor/settings">Settings and navigation</Link>
          </nav>
          <div className="mobile-menu-actions"><Link className="button button-outline" href="/dashboard">Member dashboard</Link></div>
        </div>
      </details>
      <span>{profile.full_name} · {systemRoleLabels[profile.system_role] ?? profile.system_role}</span>
    </header>
    <main className="admin-main">{children}</main>
  </div>
}
