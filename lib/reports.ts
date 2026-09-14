import type { createClient } from '@/lib/supabase/server'
import { humanize, labelForParticipantType } from '@/lib/auth/access'

type Supabase = Awaited<ReturnType<typeof createClient>>
type Row = Record<string, string | number | null>
export type Report = { title: string; columns: { key: string; label: string }[]; rows: Row[] }
export type ReportParams = Record<string, string | undefined>

export const MEMBER_REPORTS = ['listings', 'bids_placed', 'bids_received', 'payments', 'subscriptions', 'connections'] as const
export const ADMIN_REPORTS = ['members', 'subscriptions', 'payments', 'listings', 'bids', 'verification'] as const
export type MemberReport = (typeof MEMBER_REPORTS)[number]
export type AdminReport = (typeof ADMIN_REPORTS)[number]

const labels: Record<string, string> = {
  listings: 'Listings', bids_placed: 'Bids placed', bids_received: 'Bids received', payments: 'Payments',
  subscriptions: 'Subscriptions', connections: 'Connections', members: 'Members', bids: 'Bids', verification: 'Verification requests',
}
export const reportLabel = (k: string) => labels[k] ?? humanize(k)

const day = (v: string | null | undefined) => v ? new Date(v).toISOString().slice(0, 10) : null

/* Date window and sorting shared by every report. Sorting happens in memory
   because the row sets are small (per member) or capped (console, 2000). */
function finish(rows: Row[], params: ReportParams, defaultSort: string): Row[] {
  const from = params.from ? new Date(params.from) : null
  const to = params.to ? new Date(params.to + 'T23:59:59') : null
  let out = rows.filter(r => {
    const d = r.date ? new Date(String(r.date)) : null
    if (from && d && d < from) return false
    if (to && d && d > to) return false
    return true
  })
  const sort = params.sort || defaultSort
  const dir = params.dir === 'asc' ? 1 : -1
  out = [...out].sort((a, b) => {
    const x = a[sort], y = b[sort]
    if (x === y) return 0
    if (x === null || x === undefined) return 1
    if (y === null || y === undefined) return -1
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir
  })
  return out
}

/* ---- member reports: only the caller's own rows (RLS) ------------------- */
export async function memberReport(supabase: Supabase, kind: MemberReport, params: ReportParams, userId: string): Promise<Report> {
  const col = (key: string, label: string) => ({ key, label })
  if (kind === 'listings') {
    const { data } = await supabase.from('opportunities').select('id,title,status,sector,country,capital_required,currency,created_at,published_at').eq('owner_user_id', userId)
    return { title: 'Your listings', columns: [col('title', 'Title'), col('status', 'Status'), col('sector', 'Sector'), col('country', 'Country'), col('capital_required', 'Amount'), col('date', 'Created'), col('published', 'Published')],
      rows: finish((data ?? []).map(o => ({ id: o.id, title: o.title, status: humanize(o.status), sector: o.sector ?? null, country: o.country ?? null, capital_required: o.capital_required ?? null, date: day(o.created_at), published: day(o.published_at) })), params, 'date') }
  }
  if (kind === 'bids_placed' || kind === 'bids_received') {
    const { data } = await supabase.from('expressions_of_interest').select('id,opportunity_id,applicant_id,status,created_at')
    const mine = (data ?? []).filter(b => kind === 'bids_placed' ? b.applicant_id === userId : b.applicant_id !== userId)
    const oppIds = [...new Set(mine.map(b => b.opportunity_id))]
    const { data: opps } = oppIds.length ? await supabase.from('opportunities').select('id,title').in('id', oppIds) : { data: [] }
    const title = new Map((opps ?? []).map(o => [o.id, o.title]))
    return { title: kind === 'bids_placed' ? 'Bids you placed' : 'Bids on your listings', columns: [col('listing', 'Listing'), col('status', 'Stage'), col('date', 'Date')],
      rows: finish(mine.map(b => ({ id: b.id, listing: title.get(b.opportunity_id) ?? 'Listing', status: humanize(b.status), date: day(b.created_at) })), params, 'date') }
  }
  if (kind === 'payments') {
    const { data } = await supabase.from('payments').select('id,reference,amount,currency,method,provider,status,plan_code,created_at,paid_at')
    return { title: 'Your payments', columns: [col('reference', 'Reference'), col('plan', 'Plan'), col('amount', 'Amount'), col('method', 'Method'), col('status', 'Status'), col('date', 'Started'), col('paid', 'Paid')],
      rows: finish((data ?? []).map(p => ({ id: p.id, reference: p.reference, plan: humanize(p.plan_code), amount: `${p.currency} ${Number(p.amount).toLocaleString()}`, method: humanize(p.method), status: humanize(p.status), date: day(p.created_at), paid: day(p.paid_at) })), params, 'date') }
  }
  if (kind === 'subscriptions') {
    const { data } = await supabase.from('subscriptions').select('id,plan_code,status,starts_at,ends_at,created_at')
    return { title: 'Your subscription history', columns: [col('plan', 'Plan'), col('status', 'Status'), col('starts', 'Starts'), col('ends', 'Ends'), col('date', 'Requested')],
      rows: finish((data ?? []).map(s => ({ id: s.id, plan: humanize(s.plan_code), status: humanize(s.status), starts: day(s.starts_at), ends: day(s.ends_at), date: day(s.created_at) })), params, 'date') }
  }
  const { data } = await supabase.from('connections').select('id,requester_id,addressee_id,intent,status,created_at,responded_at')
  const ids = [...new Set((data ?? []).flatMap(c => [c.requester_id, c.addressee_id]).filter(i => i !== userId))]
  const { data: people } = ids.length ? await supabase.rpc('listing_owner_cards', { owner_ids: ids }) : { data: [] }
  const name = new Map((people ?? []).map(p => [p.id, p.full_name]))
  return { title: 'Your connections', columns: [col('who', 'Member'), col('direction', 'Direction'), col('intent', 'Type'), col('status', 'Status'), col('date', 'Date')],
    rows: finish((data ?? []).map(c => ({ id: c.id, who: name.get(c.requester_id === userId ? c.addressee_id : c.requester_id) ?? 'Member', direction: c.requester_id === userId ? 'Sent' : 'Received', intent: humanize(c.intent), status: humanize(c.status), date: day(c.created_at) })), params, 'date') }
}

/* ---- console reports: platform-wide, staff RLS ------------------------- */
export async function adminReport(supabase: Supabase, kind: AdminReport, params: ReportParams): Promise<Report> {
  const col = (key: string, label: string) => ({ key, label })
  const nameOf = async (ids: string[]) => {
    const uniq = [...new Set(ids)]
    const { data } = uniq.length ? await supabase.from('profiles').select('id,full_name').in('id', uniq) : { data: [] }
    return new Map((data ?? []).map(p => [p.id, p.full_name]))
  }
  if (kind === 'members') {
    let q = supabase.from('profiles').select('id,full_name,participant_type,requested_participant_type,verification_status,account_status,system_role,country,created_at,verified_at').limit(2000)
    if (params.type) q = q.or(`participant_type.eq.${params.type},requested_participant_type.eq.${params.type}`)
    if (params.status) q = q.eq('verification_status', params.status as 'verified')
    if (params.account) q = q.eq('account_status', params.account as 'active')
    const [{ data }, { data: subs }, { data: emails }] = await Promise.all([q, supabase.from('subscriptions').select('user_id,plan_code,status,ends_at').eq('status', 'active'), supabase.rpc('member_emails')])
    const plan = new Map((subs ?? []).map(s => [s.user_id, s]))
    const email = new Map((emails ?? []).map(e => [e.id, e.email]))
    let rows = (data ?? []).map(p => ({ id: p.id, name: p.full_name, email: email.get(p.id) ?? null, type: labelForParticipantType(p.participant_type ?? p.requested_participant_type), verification: humanize(p.verification_status), account: humanize(p.account_status), role: humanize(p.system_role), plan: plan.get(p.id) ? humanize(plan.get(p.id)!.plan_code) : 'None', plan_ends: day(plan.get(p.id)?.ends_at), country: p.country, date: day(p.created_at) }))
    if (params.plan) rows = rows.filter(r => params.plan === 'none' ? r.plan === 'None' : r.plan === humanize(params.plan))
    return { title: 'Members', columns: [col('name', 'Name'), col('email', 'Email'), col('type', 'Type'), col('verification', 'Verified check'), col('account', 'Account'), col('plan', 'Plan'), col('plan_ends', 'Plan ends'), col('country', 'Country'), col('date', 'Joined')], rows: finish(rows, params, 'date') }
  }
  if (kind === 'subscriptions') {
    let q = supabase.from('subscriptions').select('id,user_id,plan_code,status,starts_at,ends_at,created_at').limit(2000)
    if (params.status) q = q.eq('status', params.status as 'active')
    if (params.plan) q = q.eq('plan_code', params.plan)
    const { data } = await q; const names = await nameOf((data ?? []).map(s => s.user_id))
    return { title: 'Subscriptions', columns: [col('member', 'Member'), col('plan', 'Plan'), col('status', 'Status'), col('starts', 'Starts'), col('ends', 'Ends'), col('date', 'Requested')],
      rows: finish((data ?? []).map(s => ({ id: s.id, user_id: s.user_id, member: names.get(s.user_id) ?? 'Member', plan: humanize(s.plan_code), status: humanize(s.status), starts: day(s.starts_at), ends: day(s.ends_at), date: day(s.created_at) })), params, 'date') }
  }
  if (kind === 'payments') {
    let q = supabase.from('payments').select('id,user_id,reference,amount,currency,method,provider,status,plan_code,created_at,paid_at').limit(2000)
    if (params.status) q = q.eq('status', params.status as 'paid')
    const { data } = await q; const names = await nameOf((data ?? []).map(p => p.user_id))
    const rows = finish((data ?? []).map(p => ({ id: p.id, user_id: p.user_id, member: names.get(p.user_id) ?? 'Member', reference: p.reference, plan: humanize(p.plan_code), amount: Number(p.amount), currency: p.currency, method: humanize(p.method), provider: p.provider, status: humanize(p.status), date: day(p.created_at), paid: day(p.paid_at) })), params, 'date')
    return { title: 'Payments', columns: [col('member', 'Member'), col('reference', 'Reference'), col('plan', 'Plan'), col('amount', 'Amount'), col('currency', 'Currency'), col('method', 'Method'), col('provider', 'Provider'), col('status', 'Status'), col('date', 'Started'), col('paid', 'Paid')], rows }
  }
  if (kind === 'listings') {
    let q = supabase.from('opportunities').select('id,owner_user_id,title,status,sector,country,capital_required,currency,created_at,published_at').limit(2000)
    if (params.status) q = q.eq('status', params.status as 'published')
    const { data } = await q; const names = await nameOf((data ?? []).map(o => o.owner_user_id))
    return { title: 'Listings', columns: [col('title', 'Title'), col('owner', 'Owner'), col('status', 'Status'), col('sector', 'Sector'), col('country', 'Country'), col('capital_required', 'Amount'), col('date', 'Created'), col('published', 'Published')],
      rows: finish((data ?? []).map(o => ({ id: o.id, user_id: o.owner_user_id, title: o.title, owner: names.get(o.owner_user_id) ?? 'Member', status: humanize(o.status), sector: o.sector, country: o.country, capital_required: o.capital_required, date: day(o.created_at), published: day(o.published_at) })), params, 'date') }
  }
  if (kind === 'bids') {
    let q = supabase.from('expressions_of_interest').select('id,opportunity_id,applicant_id,status,created_at').limit(2000)
    if (params.status) q = q.eq('status', params.status as 'submitted')
    const { data } = await q
    const [names, { data: opps }] = await Promise.all([nameOf((data ?? []).map(b => b.applicant_id)), supabase.from('opportunities').select('id,title').in('id', [...new Set((data ?? []).map(b => b.opportunity_id))])])
    const title = new Map((opps ?? []).map(o => [o.id, o.title]))
    return { title: 'Bids', columns: [col('listing', 'Listing'), col('bidder', 'Bidder'), col('status', 'Stage'), col('date', 'Date')],
      rows: finish((data ?? []).map(b => ({ id: b.id, user_id: b.applicant_id, listing: title.get(b.opportunity_id) ?? 'Listing', bidder: names.get(b.applicant_id) ?? 'Member', status: humanize(b.status), date: day(b.created_at) })), params, 'date') }
  }
  let q = supabase.from('verification_requests').select('id,user_id,status,submitted_at,reviewed_at,reviewer_note').limit(2000)
  if (params.status) q = q.eq('status', params.status as 'verified')
  const { data } = await q; const names = await nameOf((data ?? []).map(v => v.user_id))
  return { title: 'Verification requests', columns: [col('member', 'Member'), col('status', 'Status'), col('date', 'Submitted'), col('reviewed', 'Reviewed'), col('note', 'Reviewer note')],
    rows: finish((data ?? []).map(v => ({ id: v.id, user_id: v.user_id, member: names.get(v.user_id) ?? 'Member', status: humanize(v.status), date: day(v.submitted_at), reviewed: day(v.reviewed_at), note: v.reviewer_note })), params, 'date') }
}

export function toCsv(report: Report): string {
  const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s }
  return [report.columns.map(c => esc(c.label)).join(','), ...report.rows.map(r => report.columns.map(c => esc(r[c.key])).join(','))].join('\r\n')
}
