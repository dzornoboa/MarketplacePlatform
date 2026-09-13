import type { createClient } from '@/lib/supabase/server'
import { AI_MODEL, aiAvailable, anthropic } from '@/lib/ai/client'

type Supabase = Awaited<ReturnType<typeof createClient>>

/* Everything the insights page charts, gathered once. Small tables, so the
   aggregation is done in JS rather than with per-metric SQL. */
export async function gatherInsights(supabase: Supabase) {
  const [{ data: profiles }, { data: subs }, { data: payments }, { data: opps }, { data: bids }, { data: plans }, { data: vrs }, { data: conns }, { data: matches }, { data: support }] = await Promise.all([
    supabase.from('profiles').select('id,participant_type,verification_status,account_status,created_at,country,system_role').limit(5000),
    supabase.from('subscriptions').select('plan_code,status,starts_at,ends_at,created_at').limit(5000),
    supabase.from('payments').select('amount,currency,status,method,provider,paid_at,created_at').limit(5000),
    supabase.from('opportunities').select('id,title,status,kind,intent,sector,country,capital_required,currency,published_at,created_at,importance').limit(5000),
    supabase.from('expressions_of_interest').select('opportunity_id,status,created_at').limit(5000),
    supabase.from('subscription_plans').select('code,name,price_usd,tier'),
    supabase.from('verification_requests').select('status,submitted_at,reviewed_at').limit(5000),
    supabase.from('connections').select('status,created_at').limit(5000),
    supabase.from('matches').select('status,score').limit(5000),
    supabase.from('support_requests').select('status,created_at').limit(5000),
  ])
  const priceByCode = new Map((plans ?? []).map(p => [p.code, Number(p.price_usd)]))
  const nameByCode = new Map((plans ?? []).map(p => [p.code, p.name]))

  // Last six months, oldest first.
  const months: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en-GB', { month: 'short' }) }) }
  const mkey = (iso: string | null) => iso ? iso.slice(0, 7) : ''
  const perMonth = <T,>(rows: T[], pick: (r: T) => string | null, val: (r: T) => number = () => 1) => months.map(m => rows.filter(r => mkey(pick(r)) === m.key).reduce((s, r) => s + val(r), 0))

  const count = <T,>(rows: T[], key: (r: T) => string | null | undefined) => {
    const out: Record<string, number> = {}
    for (const r of rows) { const k = key(r) ?? 'unknown'; out[k] = (out[k] ?? 0) + 1 }
    return out
  }
  const members = (profiles ?? []).filter(p => p.system_role === 'user')
  const paid = (payments ?? []).filter(p => p.status === 'paid')
  const active = (subs ?? []).filter(s => s.status === 'active')
  const published = (opps ?? []).filter(o => o.status === 'published')
  const dealValue = published.reduce((s, o) => s + Number(o.capital_required ?? 0), 0)

  const bidsByOpp = count(bids ?? [], b => b.opportunity_id)
  const topListings = [...published].map(o => ({ id: o.id, title: o.title, bids: bidsByOpp[o.id] ?? 0, value: Number(o.capital_required ?? 0), sector: o.sector, importance: o.importance })).sort((a, b) => b.bids - a.bids || b.value - a.value).slice(0, 6)

  const daysToReview = (vrs ?? []).filter(v => v.reviewed_at).map(v => (new Date(v.reviewed_at!).getTime() - new Date(v.submitted_at).getTime()) / 86400000)
  const avgReviewDays = daysToReview.length ? daysToReview.reduce((a, b) => a + b, 0) / daysToReview.length : null

  return {
    months: months.map(m => m.label),
    kpis: {
      members: members.length,
      verified: members.filter(m => m.verification_status === 'verified').length,
      activeSubs: active.length,
      arr: active.reduce((s, x) => s + (priceByCode.get(x.plan_code) ?? 0), 0),
      revenue: paid.reduce((s, p) => s + Number(p.amount), 0),
      revenueThisMonth: paid.filter(p => mkey(p.paid_at) === months[5].key).reduce((s, p) => s + Number(p.amount), 0),
      published: published.length,
      dealValue,
      bids: (bids ?? []).length,
      bidsAccepted: (bids ?? []).filter(b => b.status === 'accepted').length,
      connections: (conns ?? []).filter(c => c.status === 'accepted').length,
      matches: (matches ?? []).length,
      avgReviewDays,
      openSupport: (support ?? []).filter(s => s.status === 'open' || s.status === 'in_progress').length,
      expiringSoon: active.filter(s => s.ends_at && (new Date(s.ends_at).getTime() - Date.now()) / 86400000 <= 30).length,
    },
    series: {
      signups: perMonth(members, m => m.created_at),
      verifications: perMonth(vrs ?? [], v => v.reviewed_at),
      revenue: perMonth(paid, p => p.paid_at, p => Number(p.amount)),
      listings: perMonth(opps ?? [], o => o.published_at),
      bids: perMonth(bids ?? [], b => b.created_at),
    },
    breakdowns: {
      membersByType: count(members, m => m.participant_type),
      listingsByStatus: count(opps ?? [], o => o.status),
      listingsBySector: count(published, o => o.sector),
      listingsByCountry: count(published, o => o.country),
      bidsByStatus: count(bids ?? [], b => b.status),
      subsByPlan: Object.fromEntries(Object.entries(count(active, s => s.plan_code)).map(([k, v]) => [nameByCode.get(k) ?? k, v])),
      paymentsByMethod: count(paid, p => p.method),
      verificationByStatus: count(vrs ?? [], v => v.status),
      matchesByStatus: count(matches ?? [], m => m.status),
    },
    funnel: {
      signups: members.length,
      verified: members.filter(m => m.verification_status === 'verified').length,
      subscribed: new Set(active.map(s => s)).size ? active.length : 0,
      bidders: new Set((bids ?? []).map(b => b.opportunity_id)).size,
    },
    topListings,
  }
}

export type Insights = Awaited<ReturnType<typeof gatherInsights>>

/* Commentary: Claude when a key is configured, otherwise rules. Either way
   the output is a short list of plain-English observations and actions. */
export async function commentary(data: Insights): Promise<{ bullets: string[]; source: 'claude' | 'rules' }> {
  const rules = ruleBased(data)
  if (!aiAvailable()) return { bullets: rules, source: 'rules' }
  try {
    const res = await anthropic().messages.create({
      model: AI_MODEL, max_tokens: 1200,
      output_config: { effort: 'low' },
      system: 'You are the analytics assistant for WTC Accra Hub, a verified trade and investment marketplace run by World Trade Centre Accra. Given platform metrics as JSON, write 5 to 8 short bullet points (max 25 words each) for the administrators: what is working, what is stuck, and one concrete action for each problem. Use plain English and real numbers from the data. Return only the bullets, one per line, starting with "- ".',
      messages: [{ role: 'user', content: JSON.stringify({ kpis: data.kpis, months: data.months, series: data.series, breakdowns: data.breakdowns, topListings: data.topListings }) }],
    })
    const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
    const bullets = text.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean)
    return bullets.length ? { bullets, source: 'claude' } : { bullets: rules, source: 'rules' }
  } catch {
    return { bullets: rules, source: 'rules' }
  }
}

function ruleBased(d: Insights): string[] {
  const k = d.kpis, out: string[] = []
  const pct = (a: number, b: number) => b ? Math.round((a / b) * 100) : 0
  out.push(`${k.members} member${k.members === 1 ? '' : 's'}, ${k.verified} verified (${pct(k.verified, k.members)}%) and ${k.activeSubs} on an active plan worth US$${k.arr.toLocaleString()} a year.`)
  if (k.members - k.verified > 0) out.push(`${k.members - k.verified} member${k.members - k.verified === 1 ? ' is' : 's are'} not yet verified — check the verification queue and chase missing documents.`)
  if (k.verified - k.activeSubs > 0) out.push(`${k.verified - k.activeSubs} verified member${k.verified - k.activeSubs === 1 ? '' : 's'} have no active plan — a reminder about plans or a support bypass could open the marketplace for them.`)
  out.push(`${k.published} live listing${k.published === 1 ? '' : 's'} with US$${k.dealValue.toLocaleString()} of capital sought; ${k.bids} bid${k.bids === 1 ? '' : 's'} placed and ${k.bidsAccepted} accepted (${pct(k.bidsAccepted, k.bids)}% acceptance).`)
  if (k.published > 0 && k.bids === 0) out.push('No bids yet on live listings — consider featuring listings on the home feed or messaging matched members.')
  if (k.expiringSoon > 0) out.push(`${k.expiringSoon} subscription${k.expiringSoon === 1 ? '' : 's'} end within 30 days — renewal reminders go out automatically, but a personal message helps.`)
  if (k.avgReviewDays !== null) out.push(`Verification decisions take ${k.avgReviewDays < 1 ? 'under a day' : `${k.avgReviewDays.toFixed(1)} days`} on average.`)
  if (k.openSupport > 0) out.push(`${k.openSupport} support request${k.openSupport === 1 ? '' : 's'} open.`)
  out.push(`Payments received: US$${k.revenue.toLocaleString()} in total, US$${k.revenueThisMonth.toLocaleString()} this month.`)
  return out
}
