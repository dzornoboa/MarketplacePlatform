import { Avatar } from '@/components/avatar'
import { Logo } from '@/components/brand'
import { VerifiedCheck } from '@/components/verified-check'
import { labelForParticipantType } from '@/lib/auth/access'
import { VerifiedMemberShareActions } from '@/components/verified-member-share-actions'

type Props = {
  fullName: string
  username: string
  avatarUrl?: string | null
  jobTitle?: string | null
  participantType?: string | null
  country?: string | null
  city?: string | null
  showActions?: boolean
}

export function VerifiedMemberShareCard({
  fullName,
  username,
  avatarUrl,
  jobTitle,
  participantType,
  country,
  city,
  showActions = true,
}: Props) {
  const location = [city, country].filter(Boolean).join(', ')

  return <section className="verified-share-wrap">
    <div className="verified-member-card">
      <div className="verified-member-card-top">
        <Logo className="verified-member-logo" />
        <span className="verified-member-label">Verified Member</span>
      </div>

      <div className="verified-member-identity">
        <Avatar src={avatarUrl} name={fullName} size={104} className="verified-member-avatar" />
        <div>
          <p className="eyebrow">WTC Accra Hub</p>
          <h2>{fullName} <VerifiedCheck verified size={24} /></h2>
          <p className="verified-member-username">@{username}</p>
          {jobTitle && <p className="verified-member-role">{jobTitle}</p>}
          <p className="muted">{labelForParticipantType(participantType)}{location ? ` · ${location}` : ''}</p>
        </div>
      </div>

      <div className="verified-member-message">
        <strong>You&apos;re Verified On WTC Accra Hub.</strong>
        <p>Connect with <strong>@{username}</strong> on our platform to explore trusted trade, investment and partnership opportunities.</p>
      </div>

      <div className="verified-member-footer">
        <span>Verified by World Trade Centre Accra</span>
        <span>wtcaccra.com/member/{username}</span>
      </div>
    </div>

    {showActions && <VerifiedMemberShareActions username={username} fullName={fullName} />}
  </section>
}
