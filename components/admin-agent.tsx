'use client'

import { useEffect, useRef, useState } from 'react'

type Trace = { name: string; input: unknown; result: unknown; write: boolean }
type Turn = { role: 'user' | 'assistant'; text: string; trace?: Trace[] }

const QUICK = [
  'What is waiting on me right now?',
  'Show this month’s KPIs and how they compare to last month.',
  'List members pending verification with what documents they uploaded.',
  'Which listings are submitted for review? Summarise each.',
  'Are there bids awaiting due diligence? Recommend clear or reject for each.',
  'List pending payments and confirm the ones with a valid reference.',
  'Which subscriptions expire in the next 30 days? Message those members.',
]

/* Chat UI for the super-admin agent. "Allow actions" gates every write. */
export function AdminAgent({ enabled }: { enabled: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [allowWrites, setAllowWrites] = useState(false)
  const log = useRef<HTMLDivElement>(null)
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }) }, [turns])

  const send = async (message: string) => {
    if (!message.trim() || busy) return
    setText(''); setBusy(true)
    const history = turns.map(t => ({ role: t.role, text: t.text }))
    setTurns(t => [...t, { role: 'user', text: message }])
    try {
      const r = await fetch('/api/admin-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, history, allowWrites }) })
      const j = await r.json()
      setTurns(t => [...t, { role: 'assistant', text: j.ok ? j.answer : `Error: ${j.error}`, trace: j.trace }])
    } catch (e) { setTurns(t => [...t, { role: 'assistant', text: `Error: ${(e as Error).message}` }]) }
    setBusy(false)
  }

  return <div className="agent">
    <section className="agent-chat">
      <div className="agent-log" ref={log}>
        {turns.length === 0 && <div className="agent-msg agent-msg-bot">{enabled ? 'Tell me what you want done in the console — status checks, verifications, approvals, payment confirmations, bids, listings, messages, KPIs. Reads run immediately; switch on “Allow actions” to let me make changes.' : 'The agent needs ANTHROPIC_API_KEY on the server. Add it in Vercel → Settings → Environment Variables and redeploy.'}</div>}
        {turns.map((t, i) => <div key={i} style={{ display: 'contents' }}>
          {t.trace?.map((tr, j) => <div key={j} className="agent-tool">
            <strong>{tr.write ? '⚡ ' : '🔎 '}{tr.name}</strong> <code>{JSON.stringify(tr.input).slice(0, 160)}</code>
            <div><code>{typeof tr.result === 'object' && tr.result && 'ok' in (tr.result as object) ? ((tr.result as { ok: boolean; error?: string }).ok ? 'ok' : `error: ${(tr.result as { error?: string }).error}`) : ''}</code></div>
          </div>)}
          <div className={`agent-msg agent-msg-${t.role === 'user' ? 'user' : 'bot'}`}>{t.text}</div>
        </div>)}
        {busy && <div className="agent-msg agent-msg-bot">Working…</div>}
      </div>
      <form className="agent-form" onSubmit={e => { e.preventDefault(); send(text) }}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder={enabled ? 'e.g. Verify Isaac Tetteh and put him on the Corporate Buyer plan until next September' : 'Agent unavailable'} disabled={!enabled || busy} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text) } }} />
        <button className="button button-primary" type="submit" disabled={!enabled || busy || !text.trim()}>Send</button>
      </form>
    </section>
    <aside className="agent-side">
      <div className="card">
        <label className="switch"><input type="checkbox" checked={allowWrites} onChange={e => setAllowWrites(e.target.checked)} disabled={!enabled} /> <strong>Allow actions</strong></label>
        <p className="field-help">Off: the agent only reads and tells you what it would do. On: it verifies, approves, confirms, messages and edits on your instruction. Everything it does is written to the audit log under your name.</p>
      </div>
      <div className="card">
        <h3>Try</h3>
        {QUICK.map(q => <button key={q} type="button" onClick={() => send(q)} disabled={!enabled || busy}>{q}</button>)}
      </div>
      <div className="card">
        <h3>What it can do</h3>
        <ul>
          <li>Verification: approve, request changes, reject, un-verify</li>
          <li>Listings: publish, send back, reject, set deal rating</li>
          <li>Bids: clear to owner or reject</li>
          <li>Payments: confirm, fail, cancel, refund</li>
          <li>Plans: approve restricted plans, set/extend/end</li>
          <li>Members: access switches, account status, support bypass, messages</li>
          <li>Support replies, news posts, KPIs, audit lookups</li>
        </ul>
      </div>
    </aside>
  </div>
}
