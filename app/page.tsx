import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { BrandArc, BrandCircle } from '@/components/brand'
import { getHomeContent, getSiteChrome, HOME_FALLBACK, type ContentSection } from '@/lib/content/site-content'
import { MemberAware } from '@/components/header-session'

/* Content is edited in Supabase (site_content_blocks / site_content_items) by
   staff holding the 'content' capability. Headline and value-proposition copy
   follows the WTCA Brand Editorial Guide. */
export const revalidate = 300

/* The WTCA headline lockup: light-weight lead, bold navy emphasis. */
function Headline({ section, as: Tag = 'h2', className }: { section: ContentSection; as?: 'h1' | 'h2'; className?: string }) {
  return <Tag className={className}>{section.heading}{section.heading_emphasis && <> <strong>{section.heading_emphasis}</strong></>}</Tag>
}

function SectionHead({ section }: { section: ContentSection }) {
  return <div className="section-head">{section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}<Headline section={section} />{section.body && <p className="lede">{section.body}</p>}</div>
}

function Cta({ section, primaryClass, secondaryClass }: { section: ContentSection; primaryClass: string; secondaryClass: string }) {
  if (!section.cta_label && !section.secondary_cta_label) return null
  return <MemberAware memberClass={primaryClass}>
    <div className="button-row">
      {section.cta_label && <Link className={primaryClass} href={section.cta_href ?? '/register'}>{section.cta_label}</Link>}
      {section.secondary_cta_label && <Link className={secondaryClass} href={section.secondary_cta_href ?? '/login'}>{section.secondary_cta_label}</Link>}
    </div>
  </MemberAware>
}

export default async function HomePage() {
  const [content, chrome] = await Promise.all([getHomeContent(), getSiteChrome()])
  const at = (key: string) => content[key] ?? HOME_FALLBACK[key]!
  const hero = at('hero'), heroCard = at('hero_card'), about = at('about'), media = at('about_media')
  const steps = at('how-it-works'), value = at('value'), membership = at('membership'), contact = at('contact')

  return <><PublicHeader /><main>

    <section className={hero.image_url ? 'hero hero-photo' : 'hero'}>
      {hero.image_url && <>
        <img className="page-hero-photo" src={hero.image_url} alt="" aria-hidden="true" />
        <img className="page-hero-plate" src="/brand/hero-band-navy.jpg" alt="" aria-hidden="true" />
        <div className="page-hero-scrim" aria-hidden="true" />
      </>}
      <div className="hero-copy">
        {hero.eyebrow && <p className="eyebrow light">{hero.eyebrow}</p>}
        <Headline section={hero} as="h1" className="display display-on-dark" />
        {hero.body && <p className="lede lede-on-dark">{hero.body}</p>}
        <Cta section={hero} primaryClass="button button-primary" secondaryClass="button button-ghost" />
        <p className="hero-tagline">{chrome.settings.site_tagline}</p>
      </div>
      <div className="hero-card">
        <BrandArc className="hero-lock" color="var(--wtc-navy)" />
        {heroCard.eyebrow && <p className="eyebrow">{heroCard.eyebrow}</p>}
        <h2>{heroCard.heading}</h2>
        {heroCard.body && <p>{heroCard.body}</p>}
        {heroCard.items.length > 0 && <div className="trust-row">{heroCard.items.map(chip => <span key={chip.item_key}>{chip.heading}</span>)}</div>}
      </div>
    </section>

    <section id="about" className="section">
      <SectionHead section={about} />
      <div className="feature-grid">{about.items.map(feature =>
        <article className={`accent-${feature.accent}`} key={feature.item_key}>
          <BrandArc className="card-arc" color="var(--accent)" />
          <strong>{feature.heading}</strong>
          {feature.body && <p>{feature.body}</p>}
        </article>)}</div>
      {media.items.length > 0 && <div className="media-row">{media.items.map(shot =>
        <figure className={`media-circle accent-${shot.accent}`} key={shot.item_key}>
          <img src={shot.image_url ?? ''} alt={shot.image_alt ?? shot.heading} />
        </figure>)}</div>}
    </section>

    <section id="how-it-works" className="section section-soft">
      <SectionHead section={steps} />
      <div className="steps">{steps.items.map(step =>
        <article className={`accent-${step.accent}`} key={step.item_key}>
          <span>{step.eyebrow}</span>
          <h3>{step.heading}</h3>
          {step.body && <p>{step.body}</p>}
        </article>)}</div>
    </section>

    <section id="value" className="section">
      <SectionHead section={value} />
      <div className="value-grid">{value.items.map(proposition =>
        <article className={`accent-${proposition.accent}`} key={proposition.item_key}>
          <h3>{proposition.heading}</h3>
          {proposition.body && <p>{proposition.body}</p>}
        </article>)}</div>
    </section>

    <section id="membership" className="cta-section">
      <BrandCircle className="motif motif-cta" stroke={2} />
      <div>
        {membership.eyebrow && <p className="eyebrow light">{membership.eyebrow}</p>}
        <Headline section={membership} />
        {membership.body && <p>{membership.body}</p>}
      </div>
      <Cta section={membership} primaryClass="button button-light" secondaryClass="button button-ghost" />
    </section>

    <section id="contact" className="section">
      <SectionHead section={contact} />
      <div className="contact-details">{chrome.settings.contact_email && <a className="arrow-link" href={`mailto:${chrome.settings.contact_email}`}>{chrome.settings.contact_email}</a>}{chrome.settings.contact_phone && <a className="arrow-link" href={`tel:${chrome.settings.contact_phone.replace(/\s+/g, '')}`}>{chrome.settings.contact_phone}</a>}{chrome.settings.contact_address && <span className="muted">{chrome.settings.contact_address}</span>}</div>{contact.cta_label && <Link className="arrow-link" href={contact.cta_href ?? '/register'}>{contact.cta_label} →</Link>}
    </section>

  </main><PublicFooter /></>
}
