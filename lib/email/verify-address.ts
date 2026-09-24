import { promises as dns } from 'node:dns'

/* Address checks run before an account is created, so a typo or a dead
   domain is caught at registration rather than after a silent bounce.
   Syntax → disposable domain → the domain actually accepts mail (MX, or an
   A record as a fallback, which is how mail servers resolve it too). */

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'fakeinbox.com',
  'maildrop.cc', 'mohmal.com', 'emailondeck.com', 'spam4.me', 'mailnesia.com', 'tempr.email', 'moakt.com',
])

const SYNTAX = /^[^\s@,;:<>()[\]\\]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

export type AddressCheck = { ok: true; domain: string } | { ok: false; reason: string }

export async function checkEmailAddress(email: string): Promise<AddressCheck> {
  const address = email.trim()
  if (address.length > 254 || !SYNTAX.test(address)) return { ok: false, reason: 'Enter a valid email address.' }
  const domain = address.split('@')[1].toLowerCase()
  if (DISPOSABLE.has(domain)) return { ok: false, reason: 'Temporary email addresses are not accepted. Use your work email address.' }
  try {
    const mx = await dns.resolveMx(domain)
    if (mx.some(r => r.exchange)) return { ok: true, domain }
  } catch { /* fall through to the A-record check */ }
  try {
    await dns.resolve(domain)
    return { ok: true, domain }
  } catch {
    return { ok: false, reason: `We cannot deliver mail to ${domain}. Check the spelling of your email address.` }
  }
}
