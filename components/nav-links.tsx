'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavItem = { href: string; label: string }

/* Renders a list of links and marks the one for the current page. Used by the
   public header, the staff console header and the editor header so every nav
   behaves the same way. Hash links (/#about) match the home page only. */
export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname()
  const isActive = (href: string) => {
    const path = href.split('#')[0] || '/'
    if (path === '/') return pathname === '/' && !href.includes('#')
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  return <>{items.map(item => {
    const active = isActive(item.href)
    return <Link
      key={`${item.href}-${item.label}`}
      href={item.href}
      className={[className, active ? 'nav-current' : ''].filter(Boolean).join(' ') || undefined}
      aria-current={active ? 'page' : undefined}>
      {item.label}
    </Link>
  })}</>
}
