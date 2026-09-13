import { LogoLink } from '@/components/brand'
import { getSiteChrome } from '@/lib/content/site-content'
import { HeaderSession } from '@/components/header-session'
import { NavLinks } from '@/components/nav-links'

/* The mobile menu is a <details> disclosure so it works with no JavaScript and
   stays keyboard accessible. Below 820px the inline nav and the sign-in link
   are hidden and everything moves into the panel. The nav itself comes from
   site_nav_links, so editors control it. */
export async function PublicHeader() {
  const { header } = await getSiteChrome()
  return <header className="public-header">
    <LogoLink />
    <nav className="header-nav"><NavLinks items={header} /></nav>
    <div className="header-actions"><HeaderSession /></div>
    <details className="mobile-menu">
      <summary aria-label="Open menu"><span className="burger" aria-hidden="true" /></summary>
      <div className="mobile-menu-panel">
        <nav><NavLinks items={header} /></nav>
        <div className="mobile-menu-actions"><HeaderSession variant="menu" /></div>
      </div>
    </details>
  </header>
}
