import Link from 'next/link'
import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { date } from '@/lib/format'
import { BrandCircle } from '@/components/brand'

export const dynamic = 'force-dynamic'

export default async function DealRoomsPage() {
  const { supabase, profile } = await requireUserProfile()

  /* RLS returns only rooms this member owns the opportunity for, or has been
     added to. Deal rooms are opened by the WTC Accra trade desk, not members. */
  const { data: rooms } = await supabase.from('deal_rooms').select('*').order('created_at', { ascending: false })
  const roomIds = (rooms ?? []).map(r => r.id)
  const oppIds = [...new Set((rooms ?? []).map(r => r.opportunity_id))]

  const [{ data: members }, { data: opportunities }, { data: documents }] = await Promise.all([
    roomIds.length ? supabase.from('deal_room_members').select('*').in('deal_room_id', roomIds) : Promise.resolve({ data: [] }),
    oppIds.length ? supabase.from('opportunities').select('id,title,sector,country').in('id', oppIds) : Promise.resolve({ data: [] }),
    roomIds.length ? supabase.from('document_records').select('*').in('deal_room_id', roomIds) : Promise.resolve({ data: [] }),
  ])

  const peopleIds = [...new Set((members ?? []).map(m => m.user_id))]
  const { data: people } = peopleIds.length ? await supabase.rpc('listing_owner_cards', { owner_ids: peopleIds }) : { data: [] }
  const personById = new Map((people ?? []).map(p => [p.id, p]))
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal execution</p>
      <h1>Deal rooms</h1>
      <p className="muted">A private monitored space for each connected deal. A Deal Room opens after an approved connection or accepted deal request, with authorised WTC Accra monitoring roles permanently copied into the discussion.</p>
    </div>

    {(rooms ?? []).length === 0
      ? <section className="card empty-state">
          <BrandCircle />
          <h2>No deal rooms yet</h2>
          <p>When an expression of interest turns into a live transaction, WTC Accra opens a deal room and adds both parties here.</p>
        </section>
      : <div className="deal-room-grid">{(rooms ?? []).map(room => {
          const opportunity = oppById.get(room.opportunity_id)
          const roomMembers = (members ?? []).filter(m => m.deal_room_id === room.id)
          const roomDocs = (documents ?? []).filter(d => d.deal_room_id === room.id)
          const participantNames = roomMembers.slice(0, 3).map(member => {
            const person = personById.get(member.user_id)
            return member.user_id === profile.id ? 'You' : person?.full_name ?? 'Participant'
          })
          const extraParticipants = Math.max(0, roomMembers.length - participantNames.length)
          return <article className="card deal-room-card" key={room.id}>
            <div className="deal-room-card-head">
              <span className={room.status === 'active' ? 'status-dot status-verified' : 'status-dot'}>{humanize(room.status)}</span>
              <span className="deal-room-date">{date(room.created_at)}</span>
            </div>

            <div className="deal-room-card-copy">
              <h3><Link href={`/dashboard/deal-rooms/${room.id}`}>{opportunity?.title ?? 'Opportunity'}</Link></h3>
              <p className="muted">{opportunity ? [opportunity.sector, opportunity.country].filter(Boolean).join(' · ') : 'Private Transaction'}</p>
            </div>

            <dl className="deal-room-stats">
              <div><dt>Participants</dt><dd>{roomMembers.length}</dd></div>
              <div><dt>Documents</dt><dd>{roomDocs.length}</dd></div>
            </dl>

            {participantNames.length > 0 && <div className="deal-room-participants">
              <span>Participants</span>
              <p>{participantNames.join(', ')}{extraParticipants > 0 ? ` +${extraParticipants} more` : ''}</p>
            </div>}

            {roomDocs.length > 0 && <div className="deal-room-document-preview">
              <span>Latest Document</span>
              <p>{roomDocs[0]?.file_name}</p>
            </div>}

            <Link className="button button-primary deal-room-open" href={`/dashboard/deal-rooms/${room.id}`}>Open Deal Room</Link>
          </article>
        })}</div>}
  </div>
}
