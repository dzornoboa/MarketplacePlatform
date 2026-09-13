'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/* <details class="mobile-menu"> menus stay open until tapped again; this
   closes any open one when the user taps elsewhere, presses Escape, picks a
   link, or the route changes. */
export function MenuAutoClose() {
  const pathname = usePathname()
  useEffect(() => {
    const closeAll = (except?: Element | null) => document.querySelectorAll<HTMLDetailsElement>('details.mobile-menu[open]').forEach(d => { if (d !== except) d.removeAttribute('open') })
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element
      const inside = target.closest('details.mobile-menu')
      closeAll(inside)
      if (inside && target.closest('a[href]')) setTimeout(() => closeAll(), 50)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown, { passive: true }); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('keydown', onKey) }
  }, [])
  useEffect(() => { document.querySelectorAll<HTMLDetailsElement>('details.mobile-menu[open]').forEach(d => d.removeAttribute('open')) }, [pathname])
  return null
}
