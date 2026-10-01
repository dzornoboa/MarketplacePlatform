import { NextRequest, NextResponse } from 'next/server'
import { allow } from '@/lib/security/throttle'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const allowedLanguage = /^[a-z]{2,3}(?:-[A-Z]{2})?$/

/* Translations are cached in the running instance. The same page furniture
   ("Need help?", "Membership", every navigation label) is requested by every
   visitor on every page, so without this each view would pay for the whole
   interface again. Keys are language + source text. */
const CACHE = new Map<string, string>()
const CACHE_LIMIT = 20_000

function cached(language: string, text: string) {
  return CACHE.get(language + '\u0000' + text)
}

function remember(language: string, text: string, translation: string) {
  if (CACHE.size >= CACHE_LIMIT) {
    // Oldest first: a Map iterates in insertion order.
    for (const key of CACHE.keys()) {
      CACHE.delete(key)
      if (CACHE.size < CACHE_LIMIT * 0.9) break
    }
  }
  CACHE.set(language + '\u0000' + text, translation)
}

function decodeEntities(value: string) {
  return value
    .replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&nbsp;', ' ')
}

/* Money is taken out of the sentence before it is translated and put back
   afterwards. Translators otherwise rewrite "US$500" into the target language's
   own convention ("500 $ US"), which changes what the member reads and stops
   the currency converter recognising the amount. */
const MONEY_RE = /(?:US\$|USD\s?|GH₵|[$€£¥₵])\s?\d[\d,]*(?:\.\d+)?/g

function maskMoney(text: string): { masked: string; parts: string[] } {
  const parts: string[] = []
  const masked = text.replace(MONEY_RE, match => {
    parts.push(match)
    return `[[${parts.length - 1}]]`
  })
  return { masked, parts }
}

function unmaskMoney(text: string, parts: string[]): string {
  if (parts.length === 0) return text
  return text.replace(/\[\[\s*(\d+)\s*\]\]/g, (match, index: string) => parts[Number(index)] ?? match)
}

type Provider = { name: string; translate: (texts: string[], language: string) => Promise<string[] | null> }

const translationInstruction = 'Translate every input string faithfully into the requested target language. Preserve personal names, organisation names, brand names, codes, URLs, email addresses, numbers and currency values exactly. Use natural professional language appropriate for a global business platform. Return only a JSON array of translated strings in exactly the same order and length as the input.'

function parseTranslationArray(raw: string, expected: number) {
  const clean = raw.trim().replace(/^[`]{3}(?:json)?\s*/i, '').replace(/\s*[`]{3}$/, '')
  const candidates = [clean]
  const start = clean.indexOf('[')
  const end = clean.lastIndexOf(']')
  if (start >= 0 && end > start) candidates.push(clean.slice(start, end + 1))
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (Array.isArray(parsed) && parsed.length === expected && parsed.every(x => typeof x === 'string')) return parsed as string[]
    } catch {}
  }
  return null
}

/* Google Cloud Translation, when a key is configured. Fastest and most accurate
   of the options, and the only one with a support contract. */
const googleCloud: Provider = {
  name: 'google-cloud-translation',
  async translate(texts, language) {
    const key = process.env.GOOGLE_TRANSLATE_API_KEY
    if (!key) return null
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: texts, target: language.split('-')[0], source: 'en', format: 'text' }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) return null
    const data = await response.json() as { data?: { translations?: { translatedText?: string }[] } }
    const out = data.data?.translations?.map(x => decodeEntities(x.translatedText ?? '')) ?? []
    return out.length === texts.length ? out : null
  },
}

/* The endpoint the Google Translate web page itself uses. No key, no account
   and no cost, so the platform can translate before any paid service is set up.
   It is not a contracted API, so it sits behind the keyed provider and the
   platform keeps working if Google withdraws it. */
const googlePublic: Provider = {
  name: 'google-public',
  async translate(texts, language) {
    if (process.env.DISABLE_PUBLIC_TRANSLATION === '1') return null
    const target = language.split('-')[0]
    const query = texts.map(text => 'q=' + encodeURIComponent(text)).join('&')
    const response = await fetch(`https://translate.googleapis.com/translate_a/t?client=gtx&sl=en&tl=${encodeURIComponent(target)}&format=text&${query}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WTCAccraHub/1.0)' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return null
    const payload = await response.json().catch(() => null) as unknown
    const flat: string[] = []
    const walk = (value: unknown) => {
      if (typeof value === 'string') flat.push(decodeEntities(value))
      else if (Array.isArray(value)) value.forEach(walk)
    }
    walk(payload)
    return flat.length === texts.length ? flat : null
  },
}

/* Vercel AI Gateway, then Anthropic directly. Both translate well and both need
   a credential, so they come after anything free that works. */
const gateway: Provider = {
  name: 'vercel-ai-gateway',
  async translate(texts, language) {
    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    if (!token) return null
    const configured = process.env.VERCEL_TRANSLATION_MODEL?.trim()
    const models = [...new Set([configured, 'alibaba/qwen-3-14b', 'openai/gpt-5.6-sol'].filter(Boolean))] as string[]
    for (const model of models) {
      try {
        const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: translationInstruction },
              { role: 'user', content: JSON.stringify({ targetLanguage: language, texts }) },
            ],
            temperature: 0, max_tokens: 5000, stream: false,
          }),
          signal: AbortSignal.timeout(25_000),
        })
        if (!response.ok) continue
        const data = await response.json() as { choices?: { message?: { content?: string } }[] }
        const parsed = parseTranslationArray(data.choices?.[0]?.message?.content ?? '', texts.length)
        if (parsed) return parsed
      } catch {}
    }
    return null
  },
}

const anthropic: Provider = {
  name: 'anthropic',
  async translate(texts, language) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) return null
    const client = new Anthropic({ apiKey: key })
    const result = await client.messages.create({
      model: process.env.ANTHROPIC_TRANSLATION_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 5000,
      temperature: 0,
      system: translationInstruction,
      messages: [{ role: 'user', content: JSON.stringify({ targetLanguage: language, texts }) }],
    })
    const content = result.content.find(part => part.type === 'text')
    return content?.type === 'text' ? parseTranslationArray(content.text, texts.length) : null
  },
}

const PROVIDERS: Provider[] = [googleCloud, googlePublic, gateway, anthropic]

/* Which providers this deployment could use. No key material is returned — only
   whether each one is configured, so the setting can be checked from a browser
   without exposing anything. */
export async function GET() {
  return NextResponse.json({
    providers: {
      'google-cloud-translation': !!process.env.GOOGLE_TRANSLATE_API_KEY,
      'google-public': process.env.DISABLE_PUBLIC_TRANSLATION !== '1',
      'vercel-ai-gateway': !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    },
    cachedPhrases: CACHE.size,
  })
}

export async function POST(request: NextRequest) {
  /* Translation is open to visitors who are not signed in: the marketing pages,
     the membership page and the login screen all carry the language switcher,
     and refusing them was why choosing a language appeared to do nothing.
     Signed-in members get the larger allowance. */
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const signedIn = !!claimsData?.claims?.sub
  const bucket = signedIn ? 'translate' : 'translate_public'
  if (!(await allow(bucket, signedIn ? 60 : 20, 600))) {
    return NextResponse.json({ error: 'Too many translation requests. Try again shortly.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null) as { texts?: unknown; targetLanguage?: unknown } | null
  const targetLanguage = typeof body?.targetLanguage === 'string' ? body.targetLanguage : ''
  const texts = Array.isArray(body?.texts) ? body!.texts.filter((x): x is string => typeof x === 'string').slice(0, 80) : []
  if (!allowedLanguage.test(targetLanguage) || texts.length === 0 || texts.some(t => t.length > 600) || texts.join('').length > 12000) {
    return NextResponse.json({ error: 'Invalid translation request.' }, { status: 400 })
  }
  const language = targetLanguage.toLowerCase()
  if (language.startsWith('en')) return NextResponse.json({ translations: texts, provider: 'none' })

  const pending = [...new Set(texts.filter(text => cached(language, text) === undefined))]
  let used = pending.length === 0 ? 'cache' : 'none'

  if (pending.length > 0) {
    const masked = pending.map(maskMoney)
    for (const provider of PROVIDERS) {
      let result: string[] | null = null
      try { result = await provider.translate(masked.map(item => item.masked), language) } catch { result = null }
      if (!result) continue
      pending.forEach((text, index) => remember(language, text, unmaskMoney(result![index] ?? text, masked[index].parts)))
      used = provider.name
      break
    }
  }

  if (used === 'none') {
    return NextResponse.json({ error: 'No translation provider is available on this deployment.' }, { status: 503 })
  }

  return NextResponse.json({
    translations: texts.map(text => cached(language, text) ?? text),
    provider: used,
  })
}
