import Link from 'next/link'
import { BrandCircle, Logo, MemberMark } from '@/components/brand'
import { getSiteChrome } from '@/lib/content/site-content'

export async function PublicFooter() {
  const { footerPlatform, settings } = await getSiteChrome()
  return <footer className="public-footer">
    <BrandCircle className="motif motif-footer" />
    <div>
      <Logo />
      <p>{settings.footer_intro}</p>
      <MemberMark />
    </div>
    <div>
      <strong>Platform</strong>
      {footerPlatform.map(link => <Link key={`${link.href}-${link.label}`} href={link.href}>{link.label}</Link>)}
    </div>
    <div>
      <strong>Access</strong>
      <p>{settings.footer_access}</p>
      {settings.contact_email && <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a>}
      {settings.contact_phone && <a href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}>{settings.contact_phone}</a>}
      {settings.contact_address && <p className="field-help">{settings.contact_address}</p>}
    </div>
    <div className="footer-bottom">
      <span>{settings.footer_copyright}</span>
      <span>{settings.site_tagline}</span>
    </div>
  </footer>
}
