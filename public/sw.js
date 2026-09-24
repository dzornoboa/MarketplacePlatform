/* WTC Accra Hub push service worker. No offline caching — this only exists
   to receive push events and route notification clicks while the site is
   installed on a phone or a browser tab isn't open. */

self.addEventListener('install', () => { self.skipWaiting() })
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()) })

self.addEventListener('push', (event) => {
  let data = { title: 'WTC Accra Hub', body: 'You have a new notification.', href: '/dashboard/notifications' }
  if (event.data) {
    try { data = { ...data, ...event.data.json() } } catch { data.body = event.data.text() || data.body }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/brand/website-tab.png',
      badge: '/brand/website-tab.png',
      data: { href: data.href || '/dashboard/notifications' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const href = event.notification.data?.href || '/dashboard/notifications'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(href) && 'focus' in client) return client.focus()
      }
      for (const client of clients) {
        if ('navigate' in client && 'focus' in client) return client.focus().then(() => client.navigate(href))
      }
      if (self.clients.openWindow) return self.clients.openWindow(href)
    })
  )
})
