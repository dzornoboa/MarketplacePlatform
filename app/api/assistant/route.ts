import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'
import { readAccessState } from '@/lib/auth/guards'
import { AI_MODEL, aiAvailable, anthropic } from '@/lib/ai/client'
import { PLATFORM_FACTS, PLATFORM_PAGES, findPages } from '@/lib/ai/platform-map'
import { isAdminRole, isStaffRole, hasCapability } from '@/lib/auth/access'

export const dynamic = 'force-dynamic'

type Turn = { role: 'user' | 'assistant'; text: string }
type Reply = { answer: string; links: Array<{ href: string; title: string }>; escalate: boolean; source: 'claude' | 'rules' }

/* The floating helper. Answers "where do I…" and "how do I…" questions with
   links into the platform, personalised to the caller's access state. When
   it cannot help it offers to open a support request (see ?action=escalate). */
export async function POST(req: Request) {
  if (!(await allow('assistant', 40, 600))) return NextResponse.json({ ok: false, error: 'Too many requests. Please slow down.' }, { status: 429 })
  const body = await req.json().catch(() => ({})) as { question?: string; history?: Turn[]; action?: 'escalate'; subject?: string }
  if (typeof body.question === 'string' && body.question.length > 2000) return NextResponse.json({ ok: false, error: 'Question too long.' }, { status: 400 })
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null

  if (body.action === 'escalate') {
    if (!userId) return NextResponse.json({ ok: false, error: 'Sign in to send a request to the team.' }, { status: 401 })
    const subject = (body.subject ?? 'Question from the AI helper').slice(0, 180)
    const transcript = (body.history ?? []).map(t => `${t.role === 'user' ? 'Member' : 'Helper'}: ${t.text}`).join('\n').slice(0, 4500)
    const { data: request, error } = await supabase.from('support_requests').insert({ user_id: userId, subject, category: 'general', priority: 'normal' }).select('id').single()
    if (error || !request) return NextResponse.json({ ok: false, error: error?.message ?? 'Could not open the request.' }, { status: 400 })
    await supabase.from('support_messages').insert({ support_request_id: request.id, author_id: userId, body: transcript || subject })
    return NextResponse.json({ ok: true, href: '/dashboard/support' })
  }

  const question = (body.question ?? '').trim().slice(0, 1000)
  if (!question) return NextResponse.json({ ok: false, error: 'Ask a question.' }, { status: 400 })

  let audience = ['public']
  let context = 'Visitor is not signed in.'
  if (userId) {
    const [{ data: profile }, state] = await Promise.all([supabase.from('profiles').select('full_name,system_role,participant_type,verification_status,account_status').eq('id', userId).maybeSingle(), readAccessState(supabase)])
    const role = profile?.system_role ?? 'user'
    audience = ['public', 'member']
    if (isStaffRole(role)) audience.push('staff')
    if (isAdminRole(role)) audience.push('admin')
    if (hasCapability(role, 'content')) audience.push('editor')
    if (role === 'super_admin') audience.push('super_admin')
    context = `Signed in as ${profile?.full_name ?? 'member'} (role ${role}, participant type ${profile?.participant_type ?? 'not set'}). Verification: ${profile?.verification_status}. Account: ${profile?.account_status}. Active subscription: ${state?.has_active_subscription ? 'yes' : 'no'}${state?.subscription_status ? ` (${state.subscription_status})` : ''}.`
  }

  const candidates = findPages(question, audience)
  const links = candidates.map(p => ({ href: p.href, title: p.title }))

  if (!aiAvailable()) {
    const reply: Reply = candidates.length
      ? { answer: `Here is where to go:\n${candidates.map(p => `• ${p.title} — ${p.summary}`).join('\n')}`, links, escalate: false, source: 'rules' }
      : { answer: "I couldn't find that on the platform. You can send this question to the WTC Accra team and they will reply in Support.", links: [{ href: '/dashboard/support', title: 'Support' }], escalate: true, source: 'rules' }
    return NextResponse.json({ ok: true, ...reply })
  }

  const pages = PLATFORM_PAGES.filter(p => audience.includes(p.audience)).map(p => `${p.href} — ${p.title}: ${p.summary}`).join('\n')
  const history = (body.history ?? []).slice(-8)
  try {
    const res = await anthropic().messages.create({
      model: AI_MODEL, max_tokens: 700,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: `You are the in-app helper for WTC Accra Hub (World Trade Centre Accra's verified trade and investment marketplace). Answer briefly (max 120 words) and practically, in plain English. Point the user to the exact page(s) using the paths below, formatted as markdown links like [Billing](/dashboard/billing). Only mention pages the user can access. If the question is about the user's own situation (why locked, what next), use their access state. If the platform cannot do what they ask, or you are not sure, say so and end your reply with the exact line "ESCALATE" so the app can offer to send the question to the WTC Accra team.\n\nPlatform facts:\n${PLATFORM_FACTS}\n\nPages available to this user:\n${pages}`, cache_control: { type: 'ephemeral' } }],
      messages: [
        ...history.map(t => ({ role: t.role, content: t.text })),
        { role: 'user', content: `${context}\n\nQuestion: ${question}` },
      ],
    })
    let text = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
    const escalate = /\bESCALATE\b/.test(text)
    text = text.replace(/\n?\s*ESCALATE\s*$/, '').trim()
    const found = [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map(m => m[1])
    const merged = [...new Map([...found.map(h => ({ href: h, title: PLATFORM_PAGES.find(p => p.href === h)?.title ?? h })), ...links].map(l => [l.href, l])).values()].slice(0, 5)
    return NextResponse.json({ ok: true, answer: text, links: merged, escalate, source: 'claude' } satisfies Reply & { ok: true })
  } catch (err) {
    const reply: Reply = candidates.length
      ? { answer: `Here is where to go:\n${candidates.map(p => `• ${p.title} — ${p.summary}`).join('\n')}`, links, escalate: false, source: 'rules' }
      : { answer: `The assistant is unavailable right now (${(err as Error).message}). Send your question to the team instead.`, links: [{ href: '/dashboard/support', title: 'Support' }], escalate: true, source: 'rules' }
    return NextResponse.json({ ok: true, ...reply })
  }
}
