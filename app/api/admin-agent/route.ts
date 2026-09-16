import { NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'
import { AI_MODEL, aiAvailable, anthropic } from '@/lib/ai/client'
import { ADMIN_TOOLS, WRITE_TOOLS, runAdminTool } from '@/lib/ai/admin-tools'
import { PLATFORM_FACTS } from '@/lib/ai/platform-map'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type Turn = { role: 'user' | 'assistant'; text: string }
type ToolTrace = { name: string; input: unknown; result: unknown; write: boolean }

/* The super-admin agent. Only a super administrator with an MFA (aal2)
   session may call it; every tool runs with that administrator's own
   Supabase session so the database enforces permissions and writes the
   audit log. Writes are refused unless the request says allowWrites. */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (!claims?.sub) return NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('id,full_name,system_role,account_status').eq('id', String(claims.sub)).maybeSingle()
  if (!profile || profile.system_role !== 'super_admin' || profile.account_status !== 'active') return NextResponse.json({ ok: false, error: 'Super administrator only.' }, { status: 403 })
  if (claims.aal !== 'aal2') return NextResponse.json({ ok: false, error: 'Complete the MFA step first (Security → Enter code).' }, { status: 403 })
  if (!(await allow('admin_agent', 30, 600))) return NextResponse.json({ ok: false, error: 'Too many agent requests. Please slow down.' }, { status: 429 })
  if (!aiAvailable()) return NextResponse.json({ ok: false, error: 'ANTHROPIC_API_KEY is not configured on the server.' }, { status: 503 })

  const body = await req.json().catch(() => ({})) as { message?: string; history?: Turn[]; allowWrites?: boolean }
  const message = (body.message ?? '').trim().slice(0, 4000)
  if (!message) return NextResponse.json({ ok: false, error: 'Say what you need.' }, { status: 400 })
  const allowWrites = !!body.allowWrites

  const system = `You are the operations agent for the super administrator of WTC Accra Hub (World Trade Centre Accra's verified trade and investment marketplace). You work inside the administration console with tools that mirror every console page: verification, members, opportunities, bids, subscriptions, payments, support, email, audit, insights and news posts.

How to work:
- Start by reading (get_overview, list_queue, find_member, get_member) so you act on real ids, never guessed ones.
- ${allowWrites ? 'Actions are ENABLED: when instructed to verify, approve, confirm, clear, reject, message, set plans or access, do it with the tools and report exactly what changed (ids, names, new status).' : 'Actions are DISABLED for this conversation: explain what you would do and which tool you would call, and ask the administrator to enable "Allow actions" to execute. Do not call write tools.'}
- Never invent data. If a tool returns an error, show the error and suggest the fix.
- Be concise and use plain English; bullet lists for multiple items; include member names with ids when listing people.
- For KPIs and reports use get_insights and summarise the numbers; describe trends across the months provided.
- Bulk instructions ("verify everyone whose documents are complete", "confirm all pending mobile-money payments with a reference") are fine: list what you found, act on each, and report the outcome per item.
- You cannot schedule future actions yourself; if asked to schedule, do what can be done now and tell the administrator to run the instruction again at the time (or use the editor's scheduled posts).

Platform facts:
${PLATFORM_FACTS}

Signed in administrator: ${profile.full_name} (${profile.id}).`

  const history = (body.history ?? []).slice(-12)
  const messages: Anthropic.MessageParam[] = [...history.map(t => ({ role: t.role, content: t.text }) as Anthropic.MessageParam), { role: 'user', content: message }]
  const trace: ToolTrace[] = []
  const client = anthropic()

  try {
    for (let round = 0; round < 12; round++) {
      const res = await client.messages.create({
        model: AI_MODEL, max_tokens: 4000,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        tools: ADMIN_TOOLS,
        messages,
      })
      messages.push({ role: 'assistant', content: res.content })
      if (res.stop_reason !== 'tool_use') {
        const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim()
        return NextResponse.json({ ok: true, answer: text || '(no reply)', trace })
      }
      const results: Anthropic.ToolResultBlockParam[] = []
      for (const block of res.content) {
        if (block.type !== 'tool_use') continue
        const input = (block.input ?? {}) as Record<string, unknown>
        const result = await runAdminTool(supabase, block.name, input, allowWrites, profile.id)
        trace.push({ name: block.name, input, result, write: WRITE_TOOLS.has(block.name) })
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result).slice(0, 60000) })
      }
      messages.push({ role: 'user', content: results })
    }
    return NextResponse.json({ ok: true, answer: 'I stopped after many steps. Tell me how to continue.', trace })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message, trace }, { status: 500 })
  }
}
