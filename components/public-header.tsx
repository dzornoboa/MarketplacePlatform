import Link from 'next/link'
import { LogoLink } from '@/components/brand'
import { getSiteChrome } from '@/lib/content/site-content'

/* The mobile menu is a <details> disclosure so it works with no JavaScript and
   stays keyboard accessible. Below 820px the inline nav and the sign-in link
   are hidden and everything moves into the panel. */
export async function PublicHeader() {
  const { header } = await getSiteChrome()
  return <header className="public-header">
    <LogoLink />

    <nav className="header-nav">
      {header.map(link => <Link key={`${link.href}-${link.label}`} href={link.href}>{link.label}</Link>)}
    </nav>

    <div className="header-actions">
      <Link className="text-link" href="/login">Sign in</Link>
      <Link className="button button-primary" href="/register">Join the network</Link>
    </div>

    <details className="mobile-menu">
      <summary aria-label="Open menu"><span className="burger" aria-hidden="true" /></summary>
      <div className="mobile-menu-panel">
        <nav>
          {header.map(link => <Link key={`m-${link.href}-${link.label}`} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="mobile-menu-actions">
          <Link className="button button-outline" href="/login">Sign in</Link>
          <Link className="button button-primary" href="/register">Join the network</Link>
        </div>
      </div>
    </details>
  </header>
}
