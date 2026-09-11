import { requireUserProfile } from '@/lib/auth/guards'
import { humanize } from '@/lib/auth/access'
import { date, dateTime } from '@/lib/format'
import { BrandCircle } from '@/components/brand'
import { openDocument } from '../documents/actions'

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
  const { data: people } = peopleIds.length
    ? await supabase.from('profiles').select('id,full_name,job_title').in('id', peopleIds)
    : { data: [] }
  const personById = new Map((people ?? []).map(p => [p.id, p]))
  const oppById = new Map((opportunities ?? []).map(o => [o.id, o]))

  return <div className="page-stack">
    <div>
      <p className="eyebrow">Deal execution</p>
      <h1>Deal rooms</h1>
      <p className="muted">A private space per transaction, opened by the WTC Accra trade desk once both sides agree to proceed. Documents shared here are visible only to room members.</p>
    </div>

    {(rooms ?? []).length === 0
      ? <section className="card empty-state">
          <BrandCircle />
          <h2>No deal rooms yet</h2>
          <p>When an expression of interest turns into a live transaction, WTC Accra opens a deal room and adds both parties here.</p>
        </section>
      : <div className="opportunity-list">{(rooms ?? []).map(room => {
          const opportunity = oppById.get(room.opportunity_id)
          const roomMembers = (members ?? []).filter(m => m.deal_room_id === room.id)
          const roomDocs = (documents ?? []).filter(d => d.deal_room_id === room.id)
          return <article className="card opportunity-card" key={room.id}>
            <div className="opportunity-head">
              <div>
                <span className={room.status === 'active' ? 'status-dot status-verified' : 'status-dot'}>{humanize(room.status)}</span>
                <h3>{opportunity?.title ?? 'Opportunity'}</h3>
                <p className="muted">{opportunity ? `${opportunity.sector} · ${opportunity.country} · ` : ''}opened {date(room.created_at)}</p>
              </div>
            </div>

            <dl className="detail-grid detail-grid-two">
              <div><dt>Participants</dt><dd>{roomMembers.length}</dd></div>
              <div><dt>Documents</dt><dd>{roomDocs.length}</dd></div>
            </dl>

            <div className="item-editor">
              <h3>Participants</h3>
              <div className="history-list">{roomMembers.map(member => {
                const person = personById.get(member.user_id)
                return <div key={member.user_id}>
                  <strong>{member.user_id === profile.id ? 'You' : person?.full_name ?? 'Participant'}</strong>
                  <span>{humanize(member.role)}</span>
                  {person?.job_title && <p className="muted">{person.job_title}</p>}
                </div>
              })}</div>
            </div>

            {roomDocs.length > 0 && <div className="item-editor">
              <h3>Shared documents</h3>
              <div className="history-list">{roomDocs.map(doc => <div key={doc.id}>
                <strong>{doc.file_name}</strong>
                <span>{dateTime(doc.created_at)}</span>
                <form action={openDocument}>
                  <input type="hidden" name="documentId" value={doc.id} />
                  <button className="button button-outline" type="submit">Open</button>
                </form>
              </div>)}</div>
              <p className="field-help">Links are signed and expire after two minutes.</p>
            </div>}
          </article>
        })}</div>}
  </div>
}
