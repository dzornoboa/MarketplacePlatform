import Link from 'next/link'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { BrandArc, BrandCircle } from '@/components/brand'

/* Headline and messaging language is taken from the WTCA Brand Editorial
   Guide (approved headlines, messaging phrases and value propositions). */
export default function HomePage() {
  return <><PublicHeader /><main>

    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">World Trade Centre Accra</p>
        <h1 className="display">Where the world<br />does <strong>business</strong></h1>
        <p className="lede">Connect with credible buyers, investors, businesses and WTC members through a professionally managed trade and investment network — verified before it is opened.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/register">Join the network</Link>
          <Link className="button button-outline" href="/login">Member sign in</Link>
        </div>
        <p className="hero-tagline">Connecting Businesses, Globally.</p>
      </div>
      <div className="hero-card">
        <BrandArc className="hero-lock" color="var(--wtc-navy)" />
        <p className="eyebrow">Private marketplace</p>
        <h2>Opportunities stay protected.</h2>
        <p>The public website explains the network. Actual investment and trade opportunities become visible only after authentication and WTC Accra verification.</p>
        <div className="trust-row"><span>Identity</span><span>Verification</span><span>Access control</span></div>
      </div>
    </section>

    <section id="about" className="section">
      <div className="section-head">
        <p className="eyebrow">Built for trusted trade</p>
        <h2>A business platform with <strong>verification at its core</strong></h2>
        <p className="lede">The WTCA is a worldwide network of business centres, professionals and organisations across all industries, supporting one another for the betterment of global commerce. WTC Accra brings that network to Ghana.</p>
      </div>
      <div className="feature-grid">
        <article><BrandArc className="card-arc" color="var(--wtc-navy)" /><strong>Verified participants</strong><p>Buyers, investors, businesses and WTC members use one common dashboard, with privileges assigned only after review.</p></article>
        <article><BrandArc className="card-arc" color="var(--wtc-orange)" /><strong>Protected opportunities</strong><p>No public deal catalogue. Opportunity records, documents and matching tools sit behind verified access.</p></article>
        <article><BrandArc className="card-arc" color="var(--wtc-teal)" /><strong>WTC Accra oversight</strong><p>Administrators review membership claims, participant type and verification status before enabling private functions.</p></article>
      </div>
      <div className="media-row">
        <figure className="media-circle"><img src="/images/accra-investment-market-hero.webp" alt="Accra investment and trade activity" /></figure>
        <figure className="media-circle"><img src="/images/africa-trade-network.webp" alt="Regional trade network across Africa" /></figure>
        <figure className="media-circle"><img src="/images/deal-review-boardroom.webp" alt="Members reviewing a transaction" /></figure>
      </div>
    </section>

    <section id="how-it-works" className="section section-soft">
      <div className="section-head">
        <p className="eyebrow">How it works</p>
        <h2>Three steps to <strong>verified access</strong></h2>
      </div>
      <div className="steps">
        <article><span>01</span><h3>Create an account</h3><p>Choose your participant category and confirm your email address.</p></article>
        <article><span>02</span><h3>Complete verification</h3><p>Fill in your profile and submit it to WTC Accra for review.</p></article>
        <article><span>03</span><h3>Access the network</h3><p>Verified members unlock curated opportunities, matching and future deal-room services.</p></article>
      </div>
    </section>

    <section id="value" className="section">
      <div className="section-head">
        <p className="eyebrow">What membership delivers</p>
        <h2>A world of <strong>opportunity</strong></h2>
        <p className="lede">There&rsquo;s a world of opportunity out there. Can you afford not to connect with it? Six reasons members join the World Trade Centers Association network.</p>
      </div>
      <div className="value-grid">
        <article><h3>Connection</h3><p>A connected network and tools that create new business relationships and increase reach across industries and locations.</p></article>
        <article><h3>Marquee standing</h3><p>A prestigious trademark that brings authoritative name recognition and an instantly distinguished reputation.</p></article>
        <article><h3>Credibility</h3><p>Membership in a prominent and notable association raises the profile of your organisation and differentiates your brand.</p></article>
        <article><h3>Business opportunity</h3><p>Access to contacts and services opens the door for new collaboration, information and chances to grow.</p></article>
        <article><h3>Neutral positioning</h3><p>A non-political association that supports organisations regardless of political affiliation or intergovernmental activity.</p></article>
        <article><h3>Trade facilitation</h3><p>Consulting, thought leadership, training and trade services drawn from the wider WTCA member community.</p></article>
      </div>
    </section>

    <section id="membership" className="cta-section">
      <BrandCircle className="motif motif-cta" stroke={2} />
      <div>
        <p className="eyebrow light">Membership access</p>
        <h2>Start with your <strong>verified WTC Accra profile</strong></h2>
        <p>Registration is open to all; private marketplace access is controlled by WTC Accra.</p>
      </div>
      <div className="button-row">
        <Link className="button button-light" href="/register">Create account</Link>
        <Link className="button button-ghost" href="/login">Member sign in</Link>
      </div>
    </section>

    <section id="contact" className="section">
      <div className="section-head">
        <p className="eyebrow">Contact</p>
        <h2>Need help <strong>joining the platform?</strong></h2>
        <p className="lede">Contact World Trade Centre Accra for membership, verification and platform support. Existing members can raise a request from the support area of the member dashboard.</p>
      </div>
      <Link className="arrow-link" href="/register">Create your account →</Link>
    </section>

  </main><PublicFooter /></>
}
