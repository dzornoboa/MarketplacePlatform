'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Turn = { role: 'user' | 'assistant'; text: string; links?: Array<{ href: string; title: string }>; escalate?: boolean }

const SUGGESTIONS = ['How do I get verified?', 'Where do I pay for my plan?', 'How do I post a listing?', 'Why is the marketplace locked?', 'How do bids work?']

/* Floating "Need help?" button. Asks /api/assistant, renders the answer with
   links into the platform, and offers to send unanswered questions to the
   WTC Accra team as a support request. */
export function HelpAssistant({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([{ role: 'assistant', text: 'Hi! Ask me where to find anything on WTC Accra Hub, or how something works.' }])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const log = useRef<HTMLDivElement>(null)

  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' }) }, [turns, open])

  const ask = async (question: string) => {
    if (!question.trim() || busy) return
    setQ(''); setBusy(true)
    const history = turns.filter(t => t.text).map(t => ({ role: t.role, text: t.text }))
    setTurns(t => [...t, { role: 'user', text: question }])
    try {
      const r = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, history }) })
      const j = await r.json()
      setTurns(t => [...t, j.ok ? { role: 'assistant', text: j.answer, links: j.links, escalate: j.escalate } : { role: 'assistant', text: j.error ?? 'Something went wrong.' }])
    } catch { setTurns(t => [...t, { role: 'assistant', text: 'I could not reach the assistant. Try again in a moment.' }]) }
    setBusy(false)
  }

  const escalate = async () => {
    if (busy) return
    setBusy(true)
    const lastQ = [...turns].reverse().find(t => t.role === 'user')?.text ?? 'Question from the AI helper'
    const r = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'escalate', subject: lastQ.slice(0, 120), history: turns.map(t => ({ role: t.role, text: t.text })) }) })
    const j = await r.json()
    setTurns(t => [...t, { role: 'assistant', text: j.ok ? 'Sent to the WTC Accra team. They will reply under Support.' : (j.error ?? 'Could not send.'), links: j.ok ? [{ href: '/dashboard/support', title: 'Open Support' }] : [] }])
    setBusy(false)
  }

  // Render [label](/path) markdown links as real links; everything else as text.
  const render = (text: string) => text.split(/(\[[^\]]+\]\(\/[^)]+\))/g).map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/)
    return m ? <Link key={i} href={m[2]}>{m[1]}</Link> : <span key={i}>{part}</span>
  })

  return <>
    <button type="button" className="helper-fab" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="help-assistant">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 2-3 4" /><path d="M12 17h.01" /></svg>
      {open ? 'Close help' : 'Need help?'}
    </button>
    {open && <section id="help-assistant" className="helper-panel" aria-label="Help assistant">
      <header className="helper-head"><span>WTC Accra helper</span><button type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></header>
      <div className="helper-log" ref={log}>
        {turns.map((t, i) => <div key={i} className={`helper-msg helper-msg-${t.role === 'user' ? 'user' : 'bot'}`}>
          {render(t.text)}
          {t.links && t.links.length > 0 && <div className="helper-links">{t.links.map(l => <Link key={l.href} href={l.href}>{l.title} →</Link>)}</div>}
          {t.escalate && signedIn && <div className="helper-links"><button type="button" className="button button-outline" onClick={escalate} disabled={busy}>Send this to the WTC Accra team</button></div>}
          {t.escalate && !signedIn && <div className="helper-links"><Link href="/login">Sign in to contact the team →</Link><Link href="/contact">Contact page →</Link></div>}
        </div>)}
        {busy && <div className="helper-msg helper-msg-bot">Thinking…</div>}
      </div>
      {turns.length <= 1 && <div className="helper-suggest">{SUGGESTIONS.map(s => <button key={s} type="button" onClick={() => ask(s)}>{s}</button>)}</div>}
      <form className="helper-form" onSubmit={e => { e.preventDefault(); ask(q) }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ask a question…" aria-label="Your question" />
        <button type="submit" disabled={busy || !q.trim()}>Ask</button>
      </form>
    </section>}
  </>
}
