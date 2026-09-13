import Link from 'next/link'
import { BrandCircle, LogoLink } from '@/components/brand'

export default function NotFound() {
  return <main className="center-page">
    <section className="card empty-state error-page">
      <LogoLink />
      <BrandCircle />
      <p className="eyebrow">Page not found</p>
      <h1>That page isn’t here</h1>
      <p className="muted">The link may be out of date, or the listing, member or article it pointed to has been removed.</p>
      <div className="button-row">
        <Link className="button button-primary" href="/">Home</Link>
        <Link className="button button-outline" href="/opportunities">Live listings</Link>
        <Link className="button button-outline" href="/dashboard">My dashboard</Link>
      </div>
    </section>
  </main>
}
