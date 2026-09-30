import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { allow } from '@/lib/security/throttle'

const LANGUAGE_RE = /^[a-z]{2,3}$/
const CURRENCY_RE = /^[A-Z]{3}$/

export async function POST(request: NextRequest) {
  if (!(await allow('display_preferences', 60, 3600))) return NextResponse.json({ error: 'Too many preference updates.' }, { status: 429 })
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub
  if (!userId) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })

  const body = await request.json().catch(() => null) as { language?: unknown; autoTranslate?: unknown; currency?: unknown } | null
  const language = typeof body?.language === 'string' ? body.language.toLowerCase() : null
  const currency = typeof body?.currency === 'string' ? body.currency.toUpperCase() : null
  const autoTranslate = body?.autoTranslate === true

  if (language && !LANGUAGE_RE.test(language)) return NextResponse.json({ error: 'Invalid language.' }, { status: 400 })
  if (currency && !CURRENCY_RE.test(currency)) return NextResponse.json({ error: 'Invalid currency.' }, { status: 400 })

  if (language) {
    const { error } = await supabase.from('user_preferences').upsert({
      user_id: String(userId),
      language,
      auto_translate: autoTranslate,
    }, { onConflict: 'user_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (currency) {
    const { error } = await supabase.from('profiles').update({ preferred_currency: currency }).eq('id', String(userId))
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
