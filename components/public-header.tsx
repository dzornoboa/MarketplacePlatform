import Link from 'next/link'
import { LogoLink } from '@/components/brand'

export function PublicHeader() {
  return <header className="public-header"><LogoLink /><nav><Link href="/#about">About</Link><Link href="/#how-it-works">How it works</Link><Link href="/#value">Why WTC Accra</Link><Link href="/#membership">Membership</Link><Link href="/#contact">Contact</Link></nav><div className="header-actions"><Link className="text-link" href="/login">Sign in</Link><Link className="button button-primary" href="/register">Join the network</Link></div></header>
}
