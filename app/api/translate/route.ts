import { NextRequest, NextResponse } from 'next/server'
import { allow } from '@/lib/security/throttle'
import Anthropic from '@anthropic-ai/sdk'

const allowedLanguage = /^[a-z]{2,3}(?:-[A-Z]{2})?$/

export async function POST(request: NextRequest) {
  if (!(await allow('translate', 20, 600))) return NextResponse.json({ error: 'Too many translation requests. Try again shortly.' }, { status: 429 })
  const body = await request.json().catch(() => null) as { texts?: unknown; targetLanguage?: unknown } | null
  const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage : ''
  const texts = Array.isArray(body?.texts) ? body!.texts.filter((x): x is string => typeof x === 'string').slice(0, 80) : []
  if (!allowedLanguage.test(targetLanguage) || texts.length === 0 || texts.some(t => t.length > 600) || texts.join('').length > 12000) {
    return NextResponse.json({ error: 'Invalid translation request.' }, { status: 400 })
  }
  if (targetLanguage.toLowerCase().startsWith('en')) return NextResponse.json({ translations: texts })

  const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (googleKey) {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(googleKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, target: targetLanguage.split('-')[0], format: 'text' }),
    })
    if (response.ok) {
      const data = await response.json() as { data?: { translations?: { translatedText?: string }[] } }
      const translations = data.data?.translations?.map(x => x.translatedText ?? '') ?? []
      if (translations.length === texts.length) return NextResponse.json({ translations })
    }
  }

  const translationInstruction = 'Translate every input string faithfully into the requested target language. Preserve personal names, organisation names, brand names, codes, URLs, email addresses, numbers and currency values exactly. Return only a JSON array of translated strings in exactly the same order and length as the input.'

  // Vercel deployments receive a short-lived OIDC token automatically. Using
  // AI Gateway here gives the Hub a production translation provider without
  // exposing a provider key to the browser or committing credentials to code.
  const gatewayToken = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
  if (gatewayToken) {
    try {
      const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${gatewayToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.VERCEL_TRANSLATION_MODEL || 'google/gemini-3.5-flash-lite',
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
      if (response.ok) {
        const data = await response.json() as { choices?: { message?: { content?: string } }[] }
        const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
        const clean = raw.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '')
        const parsed = JSON.parse(clean) as unknown
        if (Array.isArray(parsed) && parsed.length === texts.length && parsed.every(x => typeof x === 'string')) {
          return NextResponse.json({ translations: parsed })
        }
      }
    } catch {
      // Continue to an explicitly configured Anthropic provider when available.
    }
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return NextResponse.json({ error: 'Translation service is temporarily unavailable.' }, { status: 503 })

  const client = new Anthropic({ apiKey: anthropicKey })
  const result = await client.messages.create({
    model: process.env.ANTHROPIC_TRANSLATION_MODEL || 'claude-3-5-haiku-latest',
    max_tokens: 5000,
    temperature: 0,
    system: translationInstruction,
    messages: [{ role: 'user', content: JSON.stringify({ targetLanguage, texts }) }],
  })
  const content = result.content.find(part => part.type === 'text')
  if (!content || content.type !== 'text') return NextResponse.json({ error: 'Translation failed.' }, { status: 502 })
  try {
    const parsed = JSON.parse(content.text) as unknown
    if (!Array.isArray(parsed) || parsed.length !== texts.length || !parsed.every(x => typeof x === 'string')) throw new Error('bad output')
    return NextResponse.json({ translations: parsed })
  } catch {
    return NextResponse.json({ error: 'Translation failed.' }, { status: 502 })
  }
}
