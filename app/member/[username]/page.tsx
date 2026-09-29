import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VerifiedMemberShareCard } from '@/components/verified-member-share-card'
import { LogoLink } from '@/components/brand'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ username: string }> }

export default async function PublicVerifiedMemberPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('public_verified_member_profile', { member_username: username })
  const member = data?.[0]
  if (error || !member) notFound()

  return <main className="public-member-page">
    <header className="public-member-header">
      <LogoLink />
      <div className="button-row">
        <Link className="button button-outline" href="/login">Sign In</Link>
        <Link className="button button-primary" href="/register">Join Free</Link>
      </div>
    </header>

    <section className="public-member-content">
      <VerifiedMemberShareCard
        fullName={member.full_name}
        username={member.username}
        avatarUrl={member.avatar_url}
        jobTitle={member.job_title}
        participantType={member.participant_type}
        country={member.country}
        city={member.city}
        showActions
      />

      <section className="card public-member-connect">
        <p className="eyebrow">Connect On WTC Accra Hub</p>
        <h2>Build Trusted Business Connections</h2>
        <p className="muted">Sign in or create a free account to discover verified members, explore live listings and request introductions through the WTC Accra network.</p>
        <div className="button-row">
          <Link className="button button-primary" href="/register">Join Free</Link>
          <Link className="button button-outline" href="/login">Sign In To Connect</Link>
        </div>
      </section>
    </section>
  </main>
}
