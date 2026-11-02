import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

export const metadata = {
  title: 'Membership | WTC Accra Marketplace',
  description: 'Investor, Business and WTC Accra/WTCA Member participation in the WTC Accra trade and investment marketplace.',
}

const tiers = [
  { name: 'Investor', price: 'US$1,500 / Year', fee: '0% Success Fee', description: 'For investors seeking verified investment mandates, curated opportunities and managed introductions.', details: ['Annual investor marketplace access', 'Publish investment mandates', 'Discover potential investments and request introductions', 'Subject to verification and approval'], href: '/register?type=investor' },
  { name: 'Business', price: 'Free To Join', fee: '1% Success Fee', description: 'For businesses seeking capital, buyers, suppliers, distribution and strategic partnerships.', details: ['Create an account and publish opportunities', 'Request qualified introductions', 'Use managed Deal Rooms', 'Pay on eligible verified completed transactions'], href: '/register?type=business' },
  { name: 'WTC Accra/WTCA Member', price: 'Free To Join', fee: '1% Success Fee', description: 'One marketplace category for verified WTC Accra and WTCA-affiliated members, with membership identity retained.', details: ['Register using your WTC membership affiliation', 'Verify your WTC Accra or WTCA membership ID', 'Publish and explore trade and investment opportunities', 'Pay on eligible verified completed transactions'], href: '/register?type=wtc_accra_member' },
]

export default function MembershipPage() {
  return <><PublicHeader /><main className="page-stack" style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.25rem 5rem' }}>
    <section className="card">
      <p className="eyebrow">WTC Accra Marketplace</p>
      <h1>Marketplace Membership</h1>
      <p>Three participant categories. Investors pay an annual access fee; Businesses and WTC Accra/WTCA Members join and publish opportunities for free, with a 1% success fee on eligible, verified completed transactions.</p>
      <p className="field-help">This page describes the proposed Marketplace V2 commercial model. Until the billing migration is approved and deployed, your dashboard may still display legacy subscription rules. No payment should be made based on this proposed pricing page alone.</p>
    </section>
    <section className="pricing-cards" data-count="3">
      {tiers.map(tier => <article className="card" key={tier.name}>
        <p className="eyebrow">Marketplace Participant</p>
        <h2>{tier.name}</h2><h3>{tier.price}</h3><strong>{tier.fee}</strong>
        <p>{tier.description}</p>
        <ul>{tier.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
        <Link className="button button-primary" href={tier.href}>Create Account</Link>
      </article>)}
    </section>
    <section className="card">
      <h2>WTC Accra/WTCA Member Verification</h2>
      <p>This is one commercial category with two internal affiliations: <strong>WTC Accra Member</strong> or <strong>WTCA Member</strong>. Each applicant must complete the corresponding membership ID verification. This category does not replace or confer external WTC or WTCA membership.</p>
      <h2>When Is The Success Fee Due?</h2>
      <p>For Businesses and WTC Accra/WTCA Members, the proposed 1% fee is calculated on the verified eligible completed value of a platform-facilitated deal, subject to a recorded fee agreement and Finance review. Investors pay no success fee. A separate 14-calendar-day invoicing and dispute process is planned and is not yet active.</p>
      <p><Link className="arrow-link" href="/how-it-works">How The Marketplace Works</Link></p>
    </section>
  </main><PublicFooter /></>
}
