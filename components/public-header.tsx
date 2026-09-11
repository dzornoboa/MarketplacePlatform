import Link from 'next/link'
import { LogoLink } from '@/components/brand'
import { getSiteChrome } from '@/lib/content/site-content'

export async function PublicHeader() {
  const { header } = await getSiteChrome()
  return <header className="public-header">
    <LogoLink />
    <nav>{header.map(link => <Link key={`${link.href}-${link.label}`} href={link.href}>{link.label}</Link>)}</nav>
    <div className="header-actions">
      <Link className="text-link" href="/login">Sign in</Link>
      <Link className="button button-primary" href="/register">Join the network</Link>
    </div>
  </header>
}
