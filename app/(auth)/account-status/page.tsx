import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth/guards'
import { signOut } from '../actions'
import { BrandCircle, LogoLink } from '@/components/brand'

export const dynamic = 'force-dynamic'

const COPY: Record<string, { heading: string; body: string }> = {
  suspended: {
    heading: 'Your account is suspended',
    body: 'WTC Accra has temporarily paused access to this account. Existing data is retained. Contact the membership team to understand what is needed to restore access.',
  },
  disabled: {
    heading: 'Your account is closed',
    body: 'This account has been disabled and can no longer access the WTC Accra Hub. If you believe this is an error, contact the membership team.',
  },
}

/* Blocked accounts keep their session so they can see why and reach support,
   but every dashboard guard redirects them here. */
export default async function AccountStatusPage() {
  const { profile } = await requireSession()
  if (profile.account_status !== 'suspended' && profile.account_status !== 'disabled') redirect('/dashboard')
  const copy = COPY[profile.account_status]

  return (
    <main className="center-page">
      <section className="card auth-card empty-state">
        <BrandCircle />
        <LogoLink />
        <span className={`status-dot status-${profile.account_status}`}>{profile.account_status}</span>
        <h1>{copy.heading}</h1>
        <p className="muted">{copy.body}</p>
        <div className="button-row">
          <a className="button button-primary" href="mailto:support@wtcaccra.com?subject=Account%20access">Contact membership team</a>
          <form action={signOut}><button className="button button-outline" type="submit">Sign out</button></form>
        </div>
      </section>
    </main>
  )
}
