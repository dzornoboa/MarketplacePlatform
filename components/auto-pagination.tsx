'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const PAGE_SIZE = 40
const SELECTORS = [
  '.article-grid',
  '.opportunity-list',
  '.member-grid',
  '.deal-room-grid',
  '.history-list',
  '.notification-list',
  '.content-grid',
  '.admin-card-grid',
  '.review-list',
  '.data-table tbody',
  '.thread-list',
  '.request-list',
  '.results-grid',
].join(',')

type State = { page: number; totalPages: number; nav: HTMLElement }

export function AutoPagination() {
  const pathname = usePathname()
  useEffect(() => {
    const states = new WeakMap<Element, State>()

    const render = (collection: Element, requestedPage = 1) => {
      const children = Array.from(collection.children)
      const totalPages = Math.ceil(children.length / PAGE_SIZE)
      const existing = states.get(collection)

      if (totalPages <= 1) {
        existing?.nav.remove()
        states.delete(collection)
        children.forEach(child => ((child as HTMLElement).hidden = false))
        return
      }

      const page = Math.max(1, Math.min(requestedPage, totalPages))
      children.forEach((child, index) => {
        ;(child as HTMLElement).hidden = index < (page - 1) * PAGE_SIZE || index >= page * PAGE_SIZE
      })

      let nav = existing?.nav
      if (!nav || !nav.isConnected) {
        nav = document.createElement('nav')
        nav.className = 'collection-pagination'
        nav.setAttribute('aria-label', 'Pagination')
        const host = collection.tagName === 'TBODY'
          ? (collection.closest('.table-wrap') ?? collection.closest('table') ?? collection)
          : collection
        host.insertAdjacentElement('afterend', nav)
      }

      nav.replaceChildren()

      const addButton = (label: string, target: number, disabled = false, current = false) => {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = current ? 'pagination-button pagination-current' : 'pagination-button'
        button.textContent = label
        button.disabled = disabled
        if (current) button.setAttribute('aria-current', 'page')
        button.addEventListener('click', () => {
          render(collection, target)
          collection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        nav!.appendChild(button)
      }

      addButton('← Previous', page - 1, page === 1)

      const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4))
      const windowEnd = Math.min(totalPages, windowStart + 4)
      if (windowStart > 1) {
        addButton('1', 1, false, page === 1)
        if (windowStart > 2) {
          const ellipsis = document.createElement('span')
          ellipsis.className = 'pagination-ellipsis'
          ellipsis.textContent = '…'
          nav.appendChild(ellipsis)
        }
      }
      for (let p = windowStart; p <= windowEnd; p++) addButton(String(p), p, false, p === page)
      if (windowEnd < totalPages) {
        if (windowEnd < totalPages - 1) {
          const ellipsis = document.createElement('span')
          ellipsis.className = 'pagination-ellipsis'
          ellipsis.textContent = '…'
          nav.appendChild(ellipsis)
        }
        addButton(String(totalPages), totalPages, false, page === totalPages)
      }

      addButton('Next →', page + 1, page === totalPages)

      const jumpLabel = document.createElement('label')
      jumpLabel.className = 'pagination-jump'
      jumpLabel.append('Jump To ')
      const select = document.createElement('select')
      select.setAttribute('aria-label', 'Jump to page')
      for (let p = 1; p <= totalPages; p++) {
        const option = document.createElement('option')
        option.value = String(p)
        option.textContent = 'Page ' + p
        option.selected = p === page
        select.appendChild(option)
      }
      select.addEventListener('change', () => {
        render(collection, Number(select.value))
        collection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      jumpLabel.appendChild(select)
      nav.appendChild(jumpLabel)

      const meta = document.createElement('span')
      meta.className = 'pagination-meta'
      meta.textContent = children.length + ' Items · ' + PAGE_SIZE + ' Per Page'
      nav.appendChild(meta)

      states.set(collection, { page, totalPages, nav })
    }

    const refresh = () => {
      document.querySelectorAll(SELECTORS).forEach(collection => {
        const current = states.get(collection)?.page ?? 1
        render(collection, current)
      })
    }

    const frame = window.requestAnimationFrame(refresh)
    return () => {
      window.cancelAnimationFrame(frame)
      document.querySelectorAll('.collection-pagination').forEach(node => node.remove())
      document.querySelectorAll(SELECTORS).forEach(collection => Array.from(collection.children).forEach(child => ((child as HTMLElement).hidden = false)))
    }
  }, [pathname])

  return null
}
