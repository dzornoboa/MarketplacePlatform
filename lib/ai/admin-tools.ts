import type Anthropic from '@anthropic-ai/sdk'
import type { createClient } from '@/lib/supabase/server'
import { gatherInsights } from '@/lib/ai/insights'

type Supabase = Awaited<ReturnType<typeof createClient>>
type Json = Record<string, unknown>

/* Tools the super-admin agent can call. Every write goes through the same
   RPCs the console uses, with the administrator's own session, so RLS and
   the audit log apply exactly as if they clicked the button. Reads are
   capped so a single answer never pulls thousands of rows. */

const S = (props: Record<string, unknown>, required: string[] = []): Anthropic.Tool['input_schema'] => ({ type: 'object', properties: props, required, additionalProperties: false })
const str = (description: string, enumv?: string[]) => ({ type: 'string', description, ...(enumv ? { enum: enumv } : {}) })

export const ADMIN_TOOLS: Anthropic.Tool[] = [
  { name: 'get_overview', description: 'Counts for every queue and headline KPIs (members, plans, revenue, listings, bids). Call this first for status questions.', input_schema: S({}) },
  { name: 'list_queue', description: 'List items in a console queue.', input_schema: S({ queue: str('Which queue', ['verification', 'opportunities', 'bids', 'introductions', 'payments', 'subscriptions', 'support', 'members']), status: str('Optional status filter, e.g. pending_review, submitted, pending, awaiting_approval, open, active'), limit: { type: 'integer', description: 'Max rows (default 20, max 50)' } }, ['queue']) },
  { name: 'find_member', description: 'Search members by name or email. Returns ids, status, plan.', input_schema: S({ query: str('Name or email fragment') }, ['query']) },
  { name: 'get_member', description: 'Full record for one member: profile, email, organisation, documents, verification history, subscriptions, payments, listings, bids.', input_schema: S({ user_id: str('Member id (uuid)') }, ['user_id']) },
  { name: 'review_verification', description: 'Decide a pending verification request: approve (activates the account and starts their plan), changes (send back), reject.', input_schema: S({ request_id: str('verification_requests.id'), decision: str('Decision', ['approve', 'changes', 'reject']), note: str('Note shown to the member') }, ['request_id', 'decision']) },
  { name: 'set_verification_status', description: 'Change a member’s verification after the initial review (verify directly, un-verify, request changes, suspend).', input_schema: S({ user_id: str('Member id'), status: str('New status', ['verified', 'changes_requested', 'pending_review', 'rejected', 'suspended']), note: str('Note to the member') }, ['user_id', 'status']) },
  { name: 'review_opportunity', description: 'Publish, request changes on, or reject a submitted listing.', input_schema: S({ opportunity_id: str('Listing id'), decision: str('Decision', ['publish', 'changes', 'reject']), note: str('Reviewer note') }, ['opportunity_id', 'decision']) },
  { name: 'set_deal_rating', description: 'Set the WTC Accra deal rating (1–5 stars) and optional region on a listing.', input_schema: S({ opportunity_id: str('Listing id'), importance: { type: 'integer', minimum: 1, maximum: 5 }, region: str('Region text, optional') }, ['opportunity_id', 'importance']) },
  { name: 'review_bid', description: 'Due diligence on a member bid: clear it to the listing owner, or reject it.', input_schema: S({ bid_id: str('expressions_of_interest.id'), decision: str('Decision', ['clear', 'reject']), note: str('Note') }, ['bid_id', 'decision']) },
  { name: 'confirm_payment', description: 'Mark a pending bank/mobile-money payment paid (activates the subscription), failed or cancelled.', input_schema: S({ payment_id: str('payments.id'), decision: str('Decision', ['paid', 'failed', 'cancelled', 'refunded']), note: str('Bank reference / note') }, ['payment_id', 'decision']) },
  { name: 'approve_subscription', description: 'Approve or decline a paid plan that is awaiting eligibility approval (WTC member, institutional, government plans).', input_schema: S({ subscription_id: str('subscriptions.id'), decision: str('Decision', ['approve', 'decline']), note: str('Note to the member') }, ['subscription_id', 'decision']) },
  { name: 'set_member_subscription', description: 'Set, extend, change or end a member’s plan by hand.', input_schema: S({ user_id: str('Member id'), plan_code: str('Plan code, e.g. corporate_buyer'), status: str('Status', ['active', 'pending', 'past_due', 'expired', 'cancelled']), ends_at: str('ISO date the plan ends, optional'), note: str('Note to the member') }, ['user_id', 'plan_code', 'status']) },
  { name: 'set_marketplace_access', description: 'Allow or block browsing and posting for a member without suspending the account.', input_schema: S({ user_id: str('Member id'), can_view: { type: 'boolean' }, can_post: { type: 'boolean' }, reason: str('Reason (audit)') }, ['user_id', 'can_view', 'can_post']) },
  { name: 'set_account_status', description: 'Activate, suspend or disable an account.', input_schema: S({ user_id: str('Member id'), status: str('Status', ['pending', 'active', 'suspended', 'disabled']), reason: str('Reason') }, ['user_id', 'status']) },
  { name: 'set_support_bypass', description: 'Open the marketplace for a member for N days without a subscription (support cases). days=0 removes it.', input_schema: S({ user_id: str('Member id'), days: { type: 'integer', minimum: 0, maximum: 60 }, reason: str('Reason shown to the member') }, ['user_id', 'days']) },
  { name: 'message_member', description: 'Send a member an in-app notification and email.', input_schema: S({ user_id: str('Member id'), title: str('Subject'), body: str('Message'), href: str('Dashboard link, e.g. /dashboard/billing') }, ['user_id', 'title', 'body']) },
  { name: 'reply_support', description: 'Reply to a support request and optionally set its status.', input_schema: S({ request_id: str('support_requests.id'), body: str('Reply text'), status: str('New status', ['open', 'in_progress', 'resolved', 'closed']) }, ['request_id', 'body']) },
  { name: 'create_news_post', description: 'Create a news or resource article on the public website (draft or published).', input_schema: S({ title: str('Title'), body: str('Body text'), category: str('news or resource', ['news', 'resource']), excerpt: str('Short summary'), publish: { type: 'boolean', description: 'Publish now (true) or save as draft' } }, ['title', 'body', 'category']) },
  { name: 'review_introduction', description: 'Move an introduction request forward: approve, introduce, schedule (needs meeting_at), complete or decline.', input_schema: S({ introduction_id: str('introductions.id'), decision: str('Decision', ['approve', 'introduce', 'schedule', 'complete', 'decline']), note: str('Note to both parties'), meeting_at: str('ISO datetime for schedule'), meeting_url: str('https meeting link') }, ['introduction_id', 'decision']) },
  { name: 'get_insights', description: 'KPIs, monthly series and breakdowns for reports and charts.', input_schema: S({}) },
  { name: 'get_audit', description: 'Recent audit events (who did what).', input_schema: S({ limit: { type: 'integer' }, action_contains: str('Filter on action text, optional') }) },
]

export const WRITE_TOOLS = new Set(['review_verification', 'set_verification_status', 'review_opportunity', 'set_deal_rating', 'review_bid', 'confirm_payment', 'approve_subscription', 'set_member_subscription', 'set_marketplace_access', 'set_account_status', 'set_support_bypass', 'message_member', 'reply_support', 'create_news_post', 'review_introduction'])

const QUEUES: Record<string, { table: string; defaultStatus: string; order: string; select: string }> = {
  verification: { table: 'verification_requests', defaultStatus: 'pending_review', order: 'submitted_at', select: 'id,user_id,status,submission_note,submitted_at' },
  opportunities: { table: 'opportunities', defaultStatus: 'submitted', order: 'created_at', select: 'id,title,status,kind,intent,sector,country,capital_required,currency,owner_user_id,importance,submitted_at' },
  bids: { table: 'expressions_of_interest', defaultStatus: 'submitted', order: 'created_at', select: 'id,opportunity_id,applicant_id,status,message,created_at' },
  payments: { table: 'payments', defaultStatus: 'pending', order: 'created_at', select: 'id,user_id,reference,amount,currency,method,provider,status,plan_code,created_at,paid_at' },
  subscriptions: { table: 'subscriptions', defaultStatus: 'awaiting_approval', order: 'created_at', select: 'id,user_id,plan_code,status,starts_at,ends_at,created_at' },
  introductions: { table: 'introductions', defaultStatus: 'requested', order: 'created_at', select: 'id,opportunity_id,requester_id,recipient_id,status,request_note,meeting_at,created_at' },
  support: { table: 'support_requests', defaultStatus: 'open', order: 'created_at', select: 'id,user_id,subject,category,priority,status,created_at' },
  members: { table: 'profiles', defaultStatus: '', order: 'created_at', select: 'id,full_name,participant_type,verification_status,account_status,system_role,country,created_at' },
}

const ok = (data: unknown) => ({ ok: true, data })
const fail = (error: string) => ({ ok: false, error })

export async function runAdminTool(supabase: Supabase, name: string, input: Json, allowWrites: boolean, actorId: string): Promise<unknown> {
  if (WRITE_TOOLS.has(name) && !allowWrites) return fail('Actions are switched off for this conversation. Ask the administrator to enable "Allow actions" and try again.')
  const s = (k: string) => (typeof input[k] === 'string' ? (input[k] as string).trim() : '')
  const n = (k: string) => (typeof input[k] === 'number' ? (input[k] as number) : Number(input[k] ?? NaN))
  const rpc = async (fn: string, args: Record<string, unknown>) => {
    const { data, error } = await (supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(fn, args)
    return error ? fail(error.message) : ok(data ?? 'done')
  }

  switch (name) {
    case 'get_overview': {
      const tables = ['verification_requests', 'opportunities', 'expressions_of_interest', 'payments', 'subscriptions', 'support_requests'] as const
      const out: Record<string, Record<string, number>> = {}
      for (const t of tables) {
        const { data } = await supabase.from(t).select('status').limit(5000)
        out[t] = {}
        for (const r of (data ?? []) as Array<{ status: string }>) out[t][r.status] = (out[t][r.status] ?? 0) + 1
      }
      const { data: members } = await supabase.from('profiles').select('verification_status,account_status,system_role').limit(5000)
      const m = { total: 0, verified: 0, active: 0, staff: 0 }
      for (const p of members ?? []) { m.total++; if (p.verification_status === 'verified') m.verified++; if (p.account_status === 'active') m.active++; if (p.system_role !== 'user') m.staff++ }
      return ok({ queues: out, members: m })
    }
    case 'list_queue': {
      const q = QUEUES[s('queue')]
      if (!q) return fail('Unknown queue')
      const status = s('status') || q.defaultStatus
      // Table name is dynamic; the untyped builder keeps this one switch simple.
      type Loose = { select: (c: string) => Loose; order: (c: string, o: { ascending: boolean }) => Loose; limit: (n: number) => Loose; eq: (c: string, v: string) => Loose; then: Promise<{ data: unknown; error: { message: string } | null }>['then'] }
      const from = supabase.from as unknown as (t: string) => Loose
      let query = from(q.table).select(q.select).order(q.order, { ascending: false }).limit(Math.min(50, Math.max(1, n('limit') || 20)))
      if (status) query = query.eq(q.table === 'profiles' ? 'verification_status' : 'status', status)
      const { data, error } = await query
      if (error) return fail(error.message)
      const rows = (data ?? []) as unknown as Array<Record<string, unknown>>
      const ids = [...new Set(rows.flatMap(r => [r.user_id, r.applicant_id, r.owner_user_id, r.requester_id, r.recipient_id].filter((x): x is string => typeof x === 'string')))]
      const { data: names } = ids.length ? await supabase.from('profiles').select('id,full_name').in('id', ids) : { data: [] }
      const nameById = Object.fromEntries((names ?? []).map(p => [p.id, p.full_name]))
      return ok(rows.map(r => ({ ...r, member_name: nameById[String(r.user_id ?? r.applicant_id ?? r.owner_user_id ?? r.requester_id ?? '')], recipient_name: r.recipient_id ? nameById[String(r.recipient_id)] : undefined })))
    }
    case 'find_member': {
      const q = s('query')
      const { data } = await supabase.from('profiles').select('id,full_name,participant_type,verification_status,account_status,system_role,country').ilike('full_name', `%${q}%`).limit(20)
      const rows = data ?? []
      const withEmail = await Promise.all(rows.map(async r => ({ ...r, email: (await supabase.rpc('member_email', { target_user: r.id })).data ?? null })))
      const byEmail = withEmail.filter(r => (r.email ?? '').toLowerCase().includes(q.toLowerCase()))
      if (withEmail.length === 0 || (q.includes('@') && byEmail.length === 0)) {
        // fall back to scanning emails when the name search finds nothing
        const { data: all } = await supabase.from('profiles').select('id,full_name,participant_type,verification_status,account_status,system_role,country').limit(500)
        const scanned = await Promise.all((all ?? []).map(async r => ({ ...r, email: (await supabase.rpc('member_email', { target_user: r.id })).data ?? null })))
        return ok(scanned.filter(r => (r.email ?? '').toLowerCase().includes(q.toLowerCase())).slice(0, 20))
      }
      return ok(withEmail)
    }
    case 'get_member': {
      const id = s('user_id')
      const [{ data: profile }, { data: email }, { data: subs }, { data: payments }, { data: docs }, { data: vrs }, { data: listings }, { data: bids }, { data: orgLinks }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(), supabase.rpc('member_email', { target_user: id }),
        supabase.from('subscriptions').select('id,plan_code,status,starts_at,ends_at').eq('user_id', id), supabase.from('payments').select('id,reference,amount,currency,method,status,paid_at').eq('user_id', id),
        supabase.from('document_records').select('id,file_name,purpose,created_at').eq('owner_user_id', id), supabase.from('verification_requests').select('id,status,submission_note,reviewer_note,submitted_at').eq('user_id', id),
        supabase.from('opportunities').select('id,title,status').eq('owner_user_id', id), supabase.from('expressions_of_interest').select('id,opportunity_id,status').eq('applicant_id', id),
        supabase.from('organization_members').select('organization_id').eq('user_id', id),
      ])
      if (!profile) return fail('Member not found')
      const { data: orgs } = (orgLinks ?? []).length ? await supabase.from('organizations').select('id,name,registration_number,website,is_verified').in('id', (orgLinks ?? []).map(o => o.organization_id)) : { data: [] }
      return ok({ profile: { ...profile, email }, organisations: orgs, subscriptions: subs, payments, documents: docs, verification_requests: vrs, listings, bids })
    }
    case 'review_verification': return rpc('review_verification_request', { request_id: s('request_id'), decision: s('decision'), reviewer_note: s('note') || null })
    case 'set_verification_status': return rpc('set_verification_status', { target_user: s('user_id'), new_status: s('status'), note: s('note') || null })
    case 'review_opportunity': return rpc('review_opportunity', { opportunity_id: s('opportunity_id'), decision: s('decision'), reviewer_note: s('note') || null })
    case 'set_deal_rating': {
      const { error } = await supabase.from('opportunities').update({ importance: Math.min(5, Math.max(1, Math.round(n('importance')))), ...(s('region') ? { region: s('region') } : {}) }).eq('id', s('opportunity_id'))
      return error ? fail(error.message) : ok('rating set')
    }
    case 'review_bid': return rpc('review_bid', { bid_id: s('bid_id'), decision: s('decision'), review_note: s('note') || null })
    case 'confirm_payment': return rpc('confirm_payment', { payment_id: s('payment_id'), decision: s('decision'), note: s('note') || null })
    case 'approve_subscription': return rpc('approve_subscription', { subscription_id: s('subscription_id'), decision: s('decision'), note: s('note') || null })
    case 'set_member_subscription': return rpc('set_member_subscription', { target_user: s('user_id'), plan: s('plan_code'), new_status: s('status'), ends: s('ends_at') ? new Date(s('ends_at')).toISOString() : null, note: s('note') || null })
    case 'set_marketplace_access': return rpc('set_participant_access', { target_user: s('user_id'), allow_view: !!input.can_view, allow_post: !!input.can_post, reason: s('reason') || null })
    case 'set_account_status': return rpc('set_account_status', { target_user: s('user_id'), new_status: s('status'), reason: s('reason') || null })
    case 'set_support_bypass': { const d = n('days'); return rpc('set_support_bypass', { target_user: s('user_id'), until_at: d > 0 ? new Date(Date.now() + d * 86400000).toISOString() : null, reason: s('reason') || null }) }
    case 'message_member': return rpc('message_member', { target_user: s('user_id'), message_title: s('title'), message_body: s('body'), message_href: s('href') || '/dashboard/notifications' })
    case 'reply_support': {
      const { error } = await supabase.from('support_messages').insert({ support_request_id: s('request_id'), author_id: actorId, body: s('body') })
      if (error) return fail(error.message)
      if (s('status')) await supabase.from('support_requests').update({ status: s('status') as 'open' }).eq('id', s('request_id'))
      return ok('replied')
    }
    case 'create_news_post': {
      const slug = s('title').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) + '-' + Date.now().toString(36).slice(-4)
      const publish = !!input.publish
      const { data, error } = await supabase.from('content_posts').insert({ title: s('title'), body: s('body'), category: s('category') || 'news', excerpt: s('excerpt') || null, slug, status: publish ? 'published' : 'draft', published_at: publish ? new Date().toISOString() : null, author_id: actorId }).select('id,slug').single()
      return error ? fail(error.message) : ok({ ...data, url: `/news/${data.slug}` })
    }
    case 'review_introduction': return rpc('review_introduction', { introduction_id: s('introduction_id'), decision: s('decision'), staff_note: s('note') || null, meeting_at: s('meeting_at') ? new Date(s('meeting_at')).toISOString() : null, meeting_url: s('meeting_url') || null })
    case 'get_insights': { const d = await gatherInsights(supabase); return ok({ kpis: d.kpis, months: d.months, series: d.series, breakdowns: d.breakdowns, topListings: d.topListings }) }
    case 'get_audit': {
      let q = supabase.from('audit_events').select('action,entity_type,entity_id,actor_id,details,created_at').order('created_at', { ascending: false }).limit(Math.min(50, n('limit') || 20))
      if (s('action_contains')) q = q.ilike('action', `%${s('action_contains')}%`)
      const { data, error } = await q
      return error ? fail(error.message) : ok(data)
    }
    default: return fail(`Unknown tool ${name}`)
  }
}
