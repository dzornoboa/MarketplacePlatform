import Link from 'next/link'

export function PublicHeader() {
  return <header className="public-header"><Link className="brand brand-dark" href="/">WTC ACCRA <span>Hub</span></Link><nav><Link href="/#about">About</Link><Link href="/#how-it-works">How it works</Link><Link href="/#membership">Membership</Link><Link href="/#contact">Contact</Link></nav><div className="header-actions"><Link className="text-link" href="/login">Sign in</Link><Link className="button button-primary" href="/register">Join platform</Link></div></header>
}
