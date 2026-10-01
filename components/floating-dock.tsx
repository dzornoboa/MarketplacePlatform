'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSessionState } from '@/components/header-session'
import { HelpAssistant } from '@/components/help-assistant'
import { QuickLanguageSwitcher } from '@/components/quick-language-switcher'

const POSITION_KEY = 'wtc-dock-position'
const EDGE = 10

type Offset = { right: number; bottom: number }

function clamp(offset: Offset): Offset {
  const maxRight = Math.max(EDGE, window.innerWidth - 70)
  const maxBottom = Math.max(EDGE, window.innerHeight - 70)
  return {
    right: Math.round(Math.min(Math.max(offset.right, EDGE), maxRight)),
    bottom: Math.round(Math.min(Math.max(offset.bottom, EDGE), maxBottom)),
  }
}

/* The language button and the "Need help?" button live in one dock so they stay
   together, the language button always sits directly above help, and dragging
   one moves both. The dock is mounted once in the root layout. */
export function FloatingDock() {
  const pathname = usePathname()
  const session = useSessionState()
  const [helpOpen, setHelpOpen] = useState(false)
  const [offset, setOffset] = useState<Offset | null>(null)
  const [dragging, setDragging] = useState(false)
  const dock = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointer: number; x: number; y: number; from: Offset; moved: boolean } | null>(null)

  // Help is unhelpful on the authentication screens and covers the properties
  // panel in the website builder. The language button is wanted everywhere.
  const helpAvailable = !/^\/(login|register|forgot-password|reset-password|set-password|auth)/.test(pathname)
    && !pathname.startsWith('/editor/builder')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POSITION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Offset>
        if (Number.isFinite(saved.right) && Number.isFinite(saved.bottom)) {
          setOffset(clamp({ right: Number(saved.right), bottom: Number(saved.bottom) }))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!offset) return
    const onResize = () => setOffset(current => (current ? clamp(current) : current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [offset])

  // The panel is hidden while the language list is open, and the language button
  // is hidden while the help panel is open, so neither covers the other.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('wtc-help-open', { detail: { open: helpOpen } }))
  }, [helpOpen])

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    const rect = dock.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: { right: window.innerWidth - rect.right, bottom: window.innerHeight - rect.bottom },
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!state || state.pointer !== event.pointerId) return
    const dx = event.clientX - state.x
    const dy = event.clientY - state.y
    if (!state.moved && Math.abs(dx) + Math.abs(dy) < 5) return
    state.moved = true
    setDragging(true)
    setOffset(clamp({ right: state.from.right - dx, bottom: state.from.bottom - dy }))
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    drag.current = null
    if (!state || state.pointer !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!state.moved) {
      setHelpOpen(value => !value)
      return
    }
    setDragging(false)
    setOffset(current => {
      if (current) {
        try { localStorage.setItem(POSITION_KEY, JSON.stringify(current)) } catch {}
      }
      return current
    })
  }, [])

  const style = offset ? { right: `${offset.right}px`, bottom: `${offset.bottom}px` } : undefined

  return <div ref={dock} className={dragging ? 'floating-dock floating-dock-dragging' : 'floating-dock'} style={style}>
    {helpAvailable && helpOpen && <HelpAssistant signedIn={session === 'member'} onClose={() => setHelpOpen(false)} />}
    {!helpOpen && <QuickLanguageSwitcher />}
    {helpAvailable && <button
      type="button"
      className="helper-fab"
      aria-expanded={helpOpen}
      aria-controls="help-assistant"
      title="Ask for help. Drag to move this button."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 015.8 1c0 2-3 2-3 4" /><path d="M12 17h.01" /></svg>
      {helpOpen ? 'Close help' : 'Need help?'}
    </button>}
  </div>
}
