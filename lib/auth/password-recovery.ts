import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const recoveryCookie = 'wtc-password-recovery'
export const recoveryLifetime = 600

function signature(sessionId: string, expires: number) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  return secret ? createHmac('sha256', secret).update(`password-recovery:${sessionId}:${expires}`).digest('hex') : null
}

export function passwordRecoveryGrant(sessionId: unknown) {
  if (typeof sessionId !== 'string') return null
  const expires = Math.floor(Date.now() / 1000) + recoveryLifetime
  const sig = signature(sessionId, expires)
  return sig ? `${expires}.${sig}` : null
}

export async function hasPasswordRecoveryGrant(sessionId: unknown) {
  if (typeof sessionId !== 'string') return false
  const value = (await cookies()).get(recoveryCookie)?.value ?? ''
  const match = /^(\d{10})\.([a-f0-9]{64})$/.exec(value)
  if (!match || Number(match[1]) <= Date.now() / 1000) return false
  const expected = signature(sessionId, Number(match[1]))
  return !!expected && timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(match[2], 'hex'))
}
