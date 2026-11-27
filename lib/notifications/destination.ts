import { safeNextPath } from '../auth/redirects.ts'

type NotificationLink = { href: string | null; title: string; kind?: string }

export function isWelcomeNotification({ kind, title }: NotificationLink): boolean {
  return kind === 'welcome' || (!kind && title === 'Welcome to the WTC Accra Hub')
}

export function notificationDestination(notification: NotificationLink): string {
  const href = safeNextPath(notification.href, '')
  if (isWelcomeNotification(notification) && (!href || href === '/dashboard')) {
    return '/dashboard/profile'
  }
  const ticket = /^\/admin\/support#request-([0-9a-f-]{36})$/i.exec(href)
  if (ticket) return `/admin/support?request=${ticket[1]}#request-${ticket[1]}`
  return href
}
