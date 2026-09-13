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
    // Outside tap: close. Inside tap on a link: let the click navigate first, then close.
    const onDown = (e: MouseEvent | TouchEvent) => {
      const inside = (e.target as Element).closest('details.mobile-menu')
      if (!inside) closeAll()
    }
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest('details.mobile-menu') && target.closest('a[href], button[type=submit]')) setTimeout(() => closeAll(), 250)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('mousedown', onDown); document.addEventListener('touchstart', onDown, { passive: true }); document.addEventListener('click', onClick); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) }
  }, [])
  useEffect(() => { document.querySelectorAll<HTMLDetailsElement>('details.mobile-menu[open]').forEach(d => d.removeAttribute('open')) }, [pathname])
  return null
}
