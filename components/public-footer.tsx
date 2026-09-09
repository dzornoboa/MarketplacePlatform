import Link from 'next/link'

export function PublicFooter() {
  return <footer className="public-footer"><div><div className="brand">WTC ACCRA <span>Hub</span></div><p>A trusted digital gateway connecting Ghanaian businesses, buyers and investors through the World Trade Centre network.</p></div><div><strong>Platform</strong><Link href="/#how-it-works">How it works</Link><Link href="/#membership">Membership</Link><Link href="/login">Member sign in</Link></div><div><strong>Access</strong><p>Private opportunities are available only to authenticated and WTC Accra-verified users.</p></div><div className="footer-bottom">© 2026 World Trade Centre Accra. All rights reserved.</div></footer>
}
