import { createHmac, timingSafeEqual } from 'node:crypto'

function secret() {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() || ''
}

function payload(userId: string, email: string) {
  return `${userId}:${email.trim().toLowerCase()}`
}

export function marketingUnsubscribeSignature(userId: string, email: string) {
  const key = secret()
  if (!key) return null
  return createHmac('sha256', key).update(payload(userId, email)).digest('hex')
}

export function marketingUnsubscribeUrl(siteUrl: string, userId: string, email: string) {
  const sig = marketingUnsubscribeSignature(userId, email)
  if (!sig) return null
  const url = new URL('/api/email/unsubscribe', siteUrl)
  url.searchParams.set('uid', userId)
  url.searchParams.set('email', email)
  url.searchParams.set('sig', sig)
  return url.toString()
}

export function validMarketingUnsubscribeSignature(userId: string, email: string, candidate: string) {
  const expected = marketingUnsubscribeSignature(userId, email)
  if (!expected || !/^[a-f0-9]{64}$/i.test(candidate)) return false
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(candidate, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}
