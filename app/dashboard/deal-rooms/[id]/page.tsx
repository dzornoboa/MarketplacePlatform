import Link from 'next/link'
import { VerifiedCheck } from '@/components/verified-check'
import { ParticipantBadge } from '@/components/participant-badge'
import { Avatar } from '@/components/avatar'
import { notFound } from 'next/navigation'
import { requireUserProfile } from '@/lib/auth/guards'
import { RealtimeRefresh } from '@/components/realtime-refresh'
import { SubmitButton } from '@/components/submit-button'
import { hasCapability, humanize, labelForParticipantType } from '@/lib/auth/access'
import { date, dateTime, money } from '@/lib/format'
import { uploadDocument } from '../../documents/actions'
import { closeDealRoom, postMessage } from '../actions'
import { MoneyCurrencyField } from '@/components/country-currency-fields'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

/* One deal room: the listing, who is in the room, a message thread and the
   documents shared inside it. RLS admits only the owner, the accepted
   participant(s) and WTC Accra staff. */
export default async function DealRoomPage({ params, searchParams }: Props) {
  const { supabase, profile } = await requireUserProfile()
  const { id } = await params
  const sp = await searchParams
  const error = typeof sp.error === 'string' ? sp.error : null
  const message = typeof sp.message === 'string' ? sp.message : null

  const { data: room } = await supabase.from('deal_rooms').select('*').eq('id', id).maybeSingle()
  if (!room) notFound()
  const [{ data: opp }, { data: members }, { data: messages }, { data: docs }] = await Promise.all([
    supabase.from('opportunities').select('id,title,sector,country,capital_required,currency,owner_user_id,status').eq('id', room.opportunity_id).maybeSingle(),
    supabase.from('deal_room_members').select('*').eq('deal_room_id', id),
    supabase.from('deal_room_messages').select('*').eq('deal_room_id', id).order('created_at').limit(500),
    supabase.from('document_records').select('*').eq('deal_room_id', id).order('created_at', { ascending: false }),
  ])
  const peopleIds = [...new Set([...(members ?? []).map(m => m.user_id), ...(messages ?? []).map(m => m.author_id), ...(docs ?? []).map(d => d.owner_user_id)])]
  // listing_owner_cards is SECURITY DEFINER, so counterparties (including staff) resolve even where profile RLS would hide them.
  const [{ data: cards }, { data: staffRows }] = await Promise.all([
    peopleIds.length ? supabase.rpc('listing_owner_cards', { owner_ids: peopleIds }) : Promise.resolve({ data: [] }),
    peopleIds.length ? supabase.from('profiles').select('id,system_role').in('id', peopleIds) : Promise.resolve({ data: [] }),
  ])
  const roleById = new Map((staffRows ?? []).map(r => [r.id, r.system_role]))
  const people = (cards ?? []).map(c => ({ ...c, system_role: roleById.get(c.id) ?? (c.participant_type === 'staff' ? 'staff' : 'user') }))
  const personById = new Map((people ?? []).map(p => [p.id, p]))
  const open = room.status === 'active'
  const canCloseDeal = hasCapability(profile.system_role, 'opportunities') || hasCapability(profile.system_role, 'verification')

  return <div className="page-stack">
    <RealtimeRefresh tables={["deal_room_messages","document_records","deal_rooms"]} channel={`room-${id}`} />
    <p><Link className="arrow-link" href="/dashboard/deal-rooms">← All deal rooms</Link></p>
    <div className="review-head">
      <div>
        <p className="eyebrow">Deal room · {humanize(room.status)}</p>
        <h1>{opp?.title ?? 'Listing'}</h1>
        <p className="muted">{opp ? `${opp.sector} · ${opp.country} · ${money(opp.capital_required, opp.currency)}` : ''} · opened {date(room.created_at)}</p>
      </div>
      {opp && <Link className="button button-outline" href={`/dashboard/opportunities/${opp.id}`}>View listing</Link>}
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {message && <div className="alert alert-success">{message}</div>}
    {!open && <div className="alert alert-success">This deal has been verified and closed by WTC Accra. Messages and uploads are disabled; the transaction record and documents remain available.</div>}
    {!open && room.deal_value != null && <section className="card deal-close-summary">
      <p className="eyebrow">Closed Deal Record</p>
      <dl className="detail-grid detail-grid-two">
        <div><dt>Closed Deal Value</dt><dd>{money(room.deal_value, room.deal_currency ?? 'USD')}</dd></div>
        <div><dt>Success Fee</dt><dd>{money(room.success_fee_amount, room.deal_currency ?? 'USD')} <small>({Number(room.success_fee_rate) * 100}%)</small>{room.success_fee_amount_usd != null && room.deal_currency !== 'USD' ? <><br /><small>≈ {money(room.success_fee_amount_usd, 'USD')} at recorded FX rate</small></> : null}</dd></div>
        <div><dt>Closed At</dt><dd>{dateTime(room.closed_at)}</dd></div>
        {room.deal_value_usd != null && room.deal_currency !== 'USD' && <div><dt>USD Equivalent</dt><dd>{money(room.deal_value_usd, 'USD')}{room.fx_rate_to_usd ? <small> · 1 {room.deal_currency} = {Number(room.fx_rate_to_usd).toFixed(4)} USD</small> : null}</dd></div>}
        <div><dt>Status</dt><dd>Deal Verified</dd></div>
      </dl>
      {room.close_note && <p className="field-help">WTC Accra Note: {room.close_note}</p>}
    </section>}

    <div className="split-grid admin-detail-grid deal-room-grid">
      <section className="card deal-thread">
        <h2>Messages</h2>
        <div className="deal-messages">
          {(messages ?? []).length === 0 && <p className="muted">No messages yet. Say hello and agree the next steps.</p>}
          {(messages ?? []).map(m => {
            const mine = m.author_id === profile.id
            const who = personById.get(m.author_id)
            return <div key={m.id} className={mine ? 'deal-msg deal-msg-mine' : 'deal-msg'}>
              <span className="deal-msg-meta avatar-stack">{!mine && <Avatar src={who?.avatar_url} name={who?.full_name} size={20} />}{mine ? 'You' : who?.full_name ?? 'Participant'}{who?.system_role && who.system_role !== 'user' ? ' · WTC Accra' : ''} · {dateTime(m.created_at)}</span>
              <p>{m.body}</p>
            </div>
          })}
        </div>
        {open && <form action={postMessage} className="deal-compose">
          <input type="hidden" name="roomId" value={id} />
          <textarea name="body" rows={3} maxLength={5000} required placeholder="Write a message to everyone in this room…" />
          <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
        </form>}
      </section>

      <div className="page-stack">
        <section className="card">
          <h2>In this room</h2>
          <div className="history-list compact">{(members ?? []).map(m => { const p = personById.get(m.user_id); return <div key={m.user_id}>
            <strong className="avatar-stack"><Avatar src={p?.avatar_url} name={p?.full_name} size={28} />{p?.full_name ?? 'Participant'}<VerifiedCheck verified={p?.is_verified} />{m.user_id === profile.id ? ' (you)' : ''}</strong><span>{humanize(m.role)} <ParticipantBadge type={p?.participant_type} /></span>
            <p className="muted">{p?.system_role && p.system_role !== 'user' ? 'WTC Accra staff' : labelForParticipantType(p?.participant_type)}{p?.job_title ? ` · ${p.job_title}` : ''}</p>
          </div> })}</div>
          <p className="field-help">Trade Officers, Verification Officers, Administrators and Super Administrators are permanently copied into monitored Deal Rooms so the workflow remains visible and auditable.</p>
        </section>

        {open && canCloseDeal && <section className="card">
          <p className="eyebrow">WTC Accra Workflow</p>
          <h2>Verify And Close Deal</h2>
          <p className="muted">Enter the final successfully closed transaction value. The platform records a 1% success fee and identifies the staff account authorising closure.</p>
          <form action={closeDealRoom} className="form-stack">
            <input type="hidden" name="roomId" value={id} />
            <div className="form-grid">
              <MoneyCurrencyField amountName="dealValue" amountLabel="Closed Deal Value" initialCurrency={opp?.currency ?? 'USD'} />
            </div>
            <label>Closure Note<textarea name="closeNote" rows={3} maxLength={2000} placeholder="Record the closing basis, transaction reference or internal note." /></label>
            <SubmitButton pendingLabel="Closing…">Mark Deal Verified And Closed</SubmitButton>
          </form>
        </section>}

        <section className="card">
          <h2>Shared Documents</h2>
          {(docs ?? []).length === 0 ? <p className="muted">Nothing shared yet.</p> : <div className="history-list compact">{(docs ?? []).map(d => <div key={d.id}>
            <strong>{d.file_name}</strong><span>{date(d.created_at)}</span>
            <p className="muted">{personById.get(d.owner_user_id)?.full_name ?? 'Participant'} · {humanize(d.purpose)} · <a className="arrow-link" href={`/api/documents/${d.id}`} target="_blank" rel="noopener">Open →</a></p>
          </div>)}</div>}
          {open && <form action={uploadDocument} className="form-stack">
            <input type="hidden" name="dealRoomId" value={id} />
            <input type="hidden" name="accessScope" value="private" />
            <input type="hidden" name="returnTo" value={`/dashboard/deal-rooms/${id}`} />
            <label>Share a file<input type="file" name="file" required accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" /></label>
            <label>What is it
              <select name="purpose" defaultValue="general">
                <option value="general">General</option><option value="financials">Financials</option><option value="business_certificate">Business certificate</option><option value="other">Other</option>
              </select>
            </label>
            <div><SubmitButton className="button button-outline" pendingLabel="Uploading…">Upload to room</SubmitButton></div>
            <p className="field-help">Visible only to the people in this room and WTC Accra.</p>
          </form>}
        </section>
      </div>
    </div>
  </div>
}
