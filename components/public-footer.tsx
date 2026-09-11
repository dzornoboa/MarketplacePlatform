import Link from 'next/link'
import { BrandCircle, Logo, MemberMark } from '@/components/brand'

export function PublicFooter() {
  return <footer className="public-footer"><BrandCircle className="motif motif-footer" /><div><Logo /><p>A trusted digital gateway connecting Ghanaian businesses, buyers and investors to the worldwide World Trade Centers Association network.</p><MemberMark /></div><div><strong>Platform</strong><Link href="/#about">About</Link><Link href="/#how-it-works">How it works</Link><Link href="/#membership">Membership</Link><Link href="/login">Member sign in</Link></div><div><strong>Access</strong><p>Private opportunities are available only to authenticated and WTC Accra-verified users. The public site explains the network; it never lists deals.</p></div><div className="footer-bottom"><span>© 2026 World Trade Centre Accra. All rights reserved.</span><span>Connecting Businesses, Globally.</span></div></footer>
}
