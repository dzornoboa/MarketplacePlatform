import Link from 'next/link'
import { MemberAware } from '@/components/header-session'
import { BrandArc, BrandCircle } from '@/components/brand'
import { money } from '@/lib/format'
import { labelForParticipantType } from '@/lib/auth/access'
import type { ContentSection, PlanSummary } from '@/lib/content/site-content'

/* The WTCA headline lockup: light-weight lead, bold navy emphasis. */
function Headline({ section, as: Tag = 'h2', className }: { section: ContentSection; as?: 'h1' | 'h2'; className?: string }) {
  return <Tag className={className}>{section.heading}{section.heading_emphasis && <> <strong>{section.heading_emphasis}</strong></>}</Tag>
}

function SectionHead({ section, centred }: { section: ContentSection; centred?: boolean }) {
  return <div className={centred ? 'section-head section-head-centred' : 'section-head'}>
    {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
    <Headline section={section} />
    {section.body && <p className="lede">{section.body}</p>}
  </div>
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

/* Full-bleed banner, built in layers so the copy always stays readable:
   1. the topical photograph
   2. a navy scrim, heaviest behind the text and clearing toward the image
   3. the approved WTCA background plate, blended so its globe watermark reads
      across the photo without hiding it
   4. the brand circle, then the copy.
   The plate is chosen from the section accent rather than stored separately. */
const HERO_PLATES: Record<string, string> = {
  navy: '/brand/hero-band-navy.jpg',
  orange: '/brand/hero-band-orange.jpg',
  teal: '/brand/hero-band-teal.jpg',
  gold: '/brand/hero-band-gold.jpg',
  sky: '/brand/hero-band-navy.jpg',
  peach: '/brand/hero-band-orange.jpg',
}

function PageHero({ section }: { section: ContentSection }) {
  const plate = HERO_PLATES[section.accent] ?? HERO_PLATES.navy
  return <section className={`page-hero accent-${section.accent}`}>
    {section.image_url && <img className="page-hero-photo" src={section.image_url} alt="" aria-hidden="true" />}
    <img className="page-hero-plate" src={plate} alt="" aria-hidden="true" />
    <div className="page-hero-scrim" aria-hidden="true" />
    <BrandCircle className="motif motif-page-hero" stroke={2} />
    <div className="page-hero-copy">
      {section.eyebrow && <p className="eyebrow light">{section.eyebrow}</p>}
      <Headline section={section} as="h1" className="display display-on-dark" />
      {section.body && <p className="lede lede-on-dark">{section.body}</p>}
      <Cta section={section} primaryClass="button button-light" secondaryClass="button button-ghost" />
    </div>
  </section>
}

function FeatureGrid({ section }: { section: ContentSection }) {
  return <section className="section">
    <SectionHead section={section} />
    <div className="feature-grid">{section.items.map(feature =>
      <article className={`accent-${feature.accent}`} key={feature.item_key}>
        <BrandArc className="card-arc" color="var(--accent)" />
        <strong>{feature.heading}</strong>
        {feature.body && <p>{feature.body}</p>}
      </article>)}</div>
  </section>
}

function Steps({ section }: { section: ContentSection }) {
  return <section className="section section-soft">
    <SectionHead section={section} />
    <div className="steps">{section.items.map(step =>
      <article className={`accent-${step.accent}`} key={step.item_key}>
        {step.eyebrow && <span>{step.eyebrow}</span>}
        <h3>{step.heading}</h3>
        {step.body && <p>{step.body}</p>}
      </article>)}</div>
  </section>
}

function ValueGrid({ section }: { section: ContentSection }) {
  return <section className="section">
    <SectionHead section={section} />
    <div className="value-grid">{section.items.map(entry =>
      <article className={`accent-${entry.accent}`} key={entry.item_key}>
        <h3>{entry.heading}</h3>
        {entry.body && <p>{entry.body}</p>}
      </article>)}</div>
  </section>
}

function MediaRow({ section }: { section: ContentSection }) {
  return <section className="section section-media">
    {section.heading && <p className="media-caption">{section.heading}</p>}
    <div className="media-row">{section.items.map(shot =>
      <figure className={`media-circle accent-${shot.accent}`} key={shot.item_key}>
        {shot.image_url && <img src={shot.image_url} alt={shot.image_alt ?? shot.heading} />}
      </figure>)}</div>
  </section>
}

/* Leadership profile. The portrait is an editable slot: until an approved
   photograph is uploaded in the editor, the brand circle stands in rather
   than shipping an unlicensed image of a real person. */
function Leadership({ section }: { section: ContentSection }) {
  const person = section.items[0]
  if (!person) return null
  return <section className="section section-soft">
    <div className="leadership">
      <figure className={`leadership-portrait accent-${person.accent}`}>
        {person.image_url
          ? <img src={person.image_url} alt={person.image_alt ?? person.heading} />
          : <div className="leadership-placeholder"><BrandCircle /><span>Portrait to be added</span></div>}
      </figure>
      <div className="leadership-copy">
        {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
        <Headline section={section} />
        {section.body && <p className="lede">{section.body}</p>}
        <div className="leadership-person">
          <strong>{person.heading}</strong>
          {person.eyebrow && <span>{person.eyebrow}</span>}
          {person.body && <p>{person.body}</p>}
        </div>
      </div>
    </div>
  </section>
}

function Faq({ section }: { section: ContentSection }) {
  return <section className="section">
    <SectionHead section={section} />
    <div className="faq-list">{section.items.map(entry =>
      <details className="faq-item" key={entry.item_key}>
        <summary>{entry.heading}</summary>
        {entry.body && <p>{entry.body}</p>}
      </details>)}</div>
  </section>
}

function Plans({ section, plans }: { section: ContentSection; plans: PlanSummary[] }) {
  return <section className="section section-soft">
    <SectionHead section={section} />
    {plans.length === 0
      ? <p className="muted">Plan information is being updated. Contact WTC Accra for current pricing.</p>
      : <div className="plan-grid">{plans.map(plan => <article className="card plan-card" key={plan.code}>
          <span className="eyebrow">{plan.name}</span>
          <strong className="plan-price">{money(plan.price_usd)}<small>/{plan.billing_interval}</small></strong>
          {plan.description && <p className="muted">{plan.description}</p>}
          <p className="field-help">For: {plan.target_participant_types.map(t => labelForParticipantType(t)).join(', ') || 'All participants'}</p>
          <MemberAware memberHref="/dashboard/billing" memberLabel="Manage my plan" memberClass="button button-outline"><Link className="button button-outline" href="/register">Get started</Link></MemberAware>
        </article>)}</div>}
  </section>
}

function CtaBand({ section }: { section: ContentSection }) {
  return <section className="cta-section">
    <BrandCircle className="motif motif-cta" stroke={2} />
    <div>
      {section.eyebrow && <p className="eyebrow light">{section.eyebrow}</p>}
      <Headline section={section} />
      {section.body && <p>{section.body}</p>}
    </div>
    <Cta section={section} primaryClass="button button-light" secondaryClass="button button-ghost" />
  </section>
}

function ContactBlock({ section, settings }: { section: ContentSection; settings: Record<string, string> }) {
  return <section className="section">
    <SectionHead section={section} />
    <div className="contact-cards">
      {settings.contact_email && <a className="card contact-card accent-navy" href={`mailto:${settings.contact_email}`}>
        <span className="eyebrow">Email</span><strong>{settings.contact_email}</strong></a>}
      {settings.contact_phone && <a className="card contact-card accent-orange" href={`tel:${settings.contact_phone.replace(/\s+/g, '')}`}>
        <span className="eyebrow">Telephone</span><strong>{settings.contact_phone}</strong></a>}
      {settings.contact_address && <div className="card contact-card accent-teal">
        <span className="eyebrow">Address</span><strong>{settings.contact_address}</strong></div>}
    </div>
  </section>
}

function Prose({ section }: { section: ContentSection }) {
  return <section className="section"><div className="narrow-content"><SectionHead section={section} /></div></section>
}

export function PageSections({ sections, plans = [], settings = {} }: {
  sections: ContentSection[]
  plans?: PlanSummary[]
  settings?: Record<string, string>
}) {
  return <>{sections.map(section => {
    const key = section.section_key
    switch (section.layout) {
      case 'page_hero': return <PageHero key={key} section={section} />
      case 'feature_grid': return <FeatureGrid key={key} section={section} />
      case 'steps': return <Steps key={key} section={section} />
      case 'value_grid': return <ValueGrid key={key} section={section} />
      case 'media_row': return <MediaRow key={key} section={section} />
      case 'leadership': return <Leadership key={key} section={section} />
      case 'faq': return <Faq key={key} section={section} />
      case 'plans': return <Plans key={key} section={section} plans={plans} />
      case 'cta': return <CtaBand key={key} section={section} />
      case 'contact': return <ContactBlock key={key} section={section} settings={settings} />
      default: return <Prose key={key} section={section} />
    }
  })}</>
}
