import { Resolver } from 'node:dns/promises'

/* Address checks run before an account is created, so a typo or a dead
   domain is caught at registration rather than after a silent bounce.
   Syntax → disposable domain → the domain actually accepts mail (MX, or an
   A record as a fallback, which is how mail servers resolve it too).

   Two rules keep this from standing between someone and their account:
   every lookup is bounded, and anything other than a clear "this domain does
   not exist" lets the registration through. A slow or unreachable resolver is
   our problem, not the applicant's — the check is a courtesy, not a gate. */

const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'throwawaymail.com', 'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'fakeinbox.com',
  'maildrop.cc', 'mohmal.com', 'emailondeck.com', 'spam4.me', 'mailnesia.com', 'tempr.email', 'moakt.com',
])

const SYNTAX = /^[^\s@,;:<>()[\]\\]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

// The whole check, both lookups included, gets this long.
const DNS_BUDGET_MS = 4_000

export type AddressCheck = { ok: true; domain: string } | { ok: false; reason: string }

/* Codes that mean the domain genuinely has no mail destination. Anything else
   — a timeout, a refused or unreachable resolver — is treated as unknown. */
const NO_SUCH_DOMAIN = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN'])

function codeOf(error: unknown): string {
  return typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : ''
}

async function deliverable(domain: string, signal: { expired: boolean }): Promise<boolean | null> {
  const resolver = new Resolver({ timeout: 1_500, tries: 2 })
  try {
    const mx = await resolver.resolveMx(domain)
    if (mx.some(record => record.exchange)) return true
  } catch (error) {
    if (!NO_SUCH_DOMAIN.has(codeOf(error))) return null
  }
  if (signal.expired) return null
  try {
    await resolver.resolve(domain)
    return true
  } catch (error) {
    return NO_SUCH_DOMAIN.has(codeOf(error)) ? false : null
  }
}

export async function checkEmailAddress(email: string): Promise<AddressCheck> {
  const address = email.trim()
  if (address.length > 254 || !SYNTAX.test(address)) return { ok: false, reason: 'Enter a valid email address.' }
  const domain = address.split('@')[1].toLowerCase()
  if (DISPOSABLE.has(domain)) return { ok: false, reason: 'Temporary email addresses are not accepted. Use your work email address.' }

  const signal = { expired: false }
  let timer: ReturnType<typeof setTimeout> | undefined
  const budget = new Promise<null>(resolve => {
    timer = setTimeout(() => { signal.expired = true; resolve(null) }, DNS_BUDGET_MS)
  })

  let verdict: boolean | null
  try {
    verdict = await Promise.race([deliverable(domain, signal), budget])
  } catch {
    verdict = null
  } finally {
    if (timer) clearTimeout(timer)
  }

  if (verdict === false) {
    return { ok: false, reason: `We cannot deliver mail to ${domain}. Check the spelling of your email address.` }
  }
  if (verdict === null) {
    console.error(`Could not confirm mail delivery for ${domain} in ${DNS_BUDGET_MS}ms; allowing the registration.`)
  }
  return { ok: true, domain }
}
