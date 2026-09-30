import { NextRequest, NextResponse } from 'next/server'
import { allow } from '@/lib/security/throttle'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const allowedLanguage = /^[a-z]{2,3}(?:-[A-Z]{2})?$/

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  if (!(await allow('translate', 30, 600))) return NextResponse.json({ error: 'Too many translation requests. Try again shortly.' }, { status: 429 })

  const body = await request.json().catch(() => null) as { texts?: unknown; targetLanguage?: unknown } | null
  const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage : ''
  const texts = Array.isArray(body?.texts) ? body!.texts.filter((x): x is string => typeof x === 'string').slice(0, 80) : []
  if (!allowedLanguage.test(targetLanguage) || texts.length === 0 || texts.some(t => t.length > 600) || texts.join('').length > 12000) {
    return NextResponse.json({ error: 'Invalid translation request.' }, { status: 400 })
  }
  if (targetLanguage.toLowerCase().startsWith('en')) return NextResponse.json({ translations: texts })

  const parseTranslationArray = (raw: string) => {
    const clean = raw.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '')
    const candidates = [clean]
    const start = clean.indexOf('[')
    const end = clean.lastIndexOf(']')
    if (start >= 0 && end > start) candidates.push(clean.slice(start, end + 1))
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as unknown
        if (Array.isArray(parsed) && parsed.length === texts.length && parsed.every(x => typeof x === 'string')) return parsed as string[]
      } catch {}
    }
    return null
  }

  const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (googleKey) {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(googleKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, target: targetLanguage.split('-')[0], format: 'text' }),
        signal: AbortSignal.timeout(20_000),
      })
      if (response.ok) {
        const data = await response.json() as { data?: { translations?: { translatedText?: string }[] } }
        const translations = data.data?.translations?.map(x => x.translatedText ?? '') ?? []
        if (translations.length === texts.length) return NextResponse.json({ translations, provider: 'google-translate' })
      }
    } catch {}
  }

  const translationInstruction = 'Translate every input string faithfully into the requested target language. Preserve personal names, organisation names, brand names, codes, URLs, email addresses, numbers and currency values exactly. Use natural professional language appropriate for a global business platform. Return only a JSON array of translated strings in exactly the same order and length as the input.'

  // Vercel provides a short-lived OIDC token at runtime. This keeps provider
  // credentials server-side and avoids exposing any translation secret to the browser.
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
  if (gatewayToken) {
    const configuredModel = process.env.VERCEL_TRANSLATION_MODEL?.trim()
    const gatewayModels = [...new Set([configuredModel, 'alibaba/qwen-3-14b', 'openai/gpt-5.6-sol'].filter(Boolean))] as string[]

    for (const model of gatewayModels) {
      try {
        const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${gatewayToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: translationInstruction },
              { role: 'user', content: JSON.stringify({ targetLanguage, texts }) },
            ],
            temperature: 0,
            max_tokens: 5000,
            stream: false,
          }),
          signal: AbortSignal.timeout(25_000),
        })
        if (!response.ok) continue

        const data = await response.json() as { choices?: { message?: { content?: string } }[] }
        const parsed = parseTranslationArray(data.choices?.[0]?.message?.content ?? '')
        if (parsed) return NextResponse.json({ translations: parsed, provider: 'vercel-ai-gateway' })
      } catch {
        // Try the next gateway model before falling back to another provider.
      }
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey })
      const result = await client.messages.create({
        model: process.env.ANTHROPIC_TRANSLATION_MODEL || 'claude-3-5-haiku-latest',
        max_tokens: 5000,
        temperature: 0,
        system: translationInstruction,
        messages: [{ role: 'user', content: JSON.stringify({ targetLanguage, texts }) }],
      })
      const content = result.content.find(part => part.type === 'text')
      if (content?.type === 'text') {
        const parsed = parseTranslationArray(content.text)
        if (parsed) return NextResponse.json({ translations: parsed, provider: 'anthropic' })
      }
    } catch {}
  }

  return NextResponse.json({ error: 'Translation service is temporarily unavailable.' }, { status: 503 })
}
