'use client'

import { useEffect } from 'react'

export function DismissOpenDetails() {
  useEffect(() => {
    const closeAll = (except?: HTMLDetailsElement | null) => {
      document.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(detail => {
        if (detail !== except) detail.open = false
      })
    }

    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      const inside = target instanceof Element ? target.closest('details[open]') as HTMLDetailsElement | null : null
      if (!inside) closeAll()
      else closeAll(inside)
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAll()
    }

    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return null
}
