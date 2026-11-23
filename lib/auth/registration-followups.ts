import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteUrl } from '@/lib/supabase/config'

function sign(value: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('Registration follow-up is unavailable')
  return createHmac('sha256', key).update(`registration-followup:${value}`).digest('hex')
}

export function registrationFollowupUrl(id: string) {
  const payload = `${id}.${Date.now() + 7 * 86_400_000}`
  return new URL(`/register?resume=${payload}.${sign(payload)}`, getSiteUrl()).toString()
}

export async function readRegistrationFollowup(token: string) {
  const match = /^([a-f0-9-]{36})\.(\d{13})\.([a-f0-9]{64})$/.exec(token)
  if (!match || Number(match[2]) < Date.now()) return null
  try {
    const [, id, expiry, signature] = match
    if (!timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(sign(`${id}.${expiry}`), 'hex'))) return null
    const { data } = await createAdminClient().from('registration_followups')
      .select('email,full_name,participant_type').eq('id', id).maybeSingle()
    return data
  } catch {
    return null
  }
}

export async function trackRegistrationFailure(email: string, fullName: string, participantType: string) {
  try {
    const { error } = await createAdminClient().from('registration_followups').upsert({
      email: email.toLowerCase(), full_name: fullName.slice(0, 150), participant_type: participantType,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })
    if (error) console.error('Registration follow-up could not be recorded', error.code)
  } catch {
    console.error('Registration follow-up unavailable')
  }
}

export async function clearRegistrationFollowup(email: string) {
  try {
    const { error } = await createAdminClient().from('registration_followups').delete().eq('email', email.toLowerCase())
    if (error) console.error('Registration follow-up could not be closed', error.code)
  } catch {
    console.error('Registration follow-up unavailable')
  }
}
