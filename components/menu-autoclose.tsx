'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/* Dropdown-style <details> controls close when the user clicks elsewhere,
   presses Escape, follows a link, submits a menu form, or changes route.
   FAQ/content disclosure panels are intentionally not included. */
export function MenuAutoClose() {
  const pathname = usePathname()
  useEffect(() => {
    const selector = 'details.mobile-menu[open],details.member-top-me[open],details.connect-block[open],details.eoi-block[open]'
    const closeAll = (except?: Element | null) => document.querySelectorAll<HTMLDetailsElement>(selector).forEach(d => { if (d !== except) d.removeAttribute('open') })
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element | null
      const inside = target?.closest('details.mobile-menu,details.member-top-me,details.connect-block,details.eoi-block') ?? null
      if (!inside) closeAll()
      else closeAll(inside)
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (target?.closest('details.mobile-menu,details.member-top-me,details.connect-block,details.eoi-block') && target.closest('a[href], button[type=submit]')) setTimeout(() => closeAll(), 250)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown, { passive: true })
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])
  useEffect(() => {
    document.querySelectorAll<HTMLDetailsElement>('details.mobile-menu[open],details.member-top-me[open],details.connect-block[open],details.eoi-block[open]').forEach(d => d.removeAttribute('open'))
  }, [pathname])
  return null
}
