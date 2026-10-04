import { NextResponse } from 'next/server'
import { allow } from '@/lib/security/throttle'

export const revalidate = 3600

type RateResponse = {
  result?: string
  rates?: Record<string, number>
  time_last_update_utc?: string
}

export async function GET(request: Request) {
  if (!(await allow('fx_quote', 90, 600))) return NextResponse.json({ error: 'Too many currency requests. Try again shortly.' }, { status: 429 })
  const url = new URL(request.url)
  const from = (url.searchParams.get('from') ?? 'USD').trim().toUpperCase()
  const to = (url.searchParams.get('to') ?? 'USD').trim().toUpperCase()
  const amount = Number(url.searchParams.get('amount') ?? '1')

  if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || !Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: 'Invalid currency conversion request.' }, { status: 400 })
  }

  if (from === to) {
    return NextResponse.json({ from, to, amount, rate: 1, converted: amount, source: 'identity' })
  }

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) throw new Error(`FX service returned ${response.status}`)
    const data = await response.json() as RateResponse
    const rate = Number(data.rates?.[to])
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Currency pair unavailable')
    return NextResponse.json({
      from,
      to,
      amount,
      rate,
      converted: amount * rate,
      asOf: data.time_last_update_utc ?? null,
      source: 'open.er-api.com',
    }, { headers: { 'Cache-Control': 'public, max-age=900, s-maxage=3600' } })
  } catch {
    return NextResponse.json(
      { error: 'Live exchange rate is temporarily unavailable.', from, to, amount },
      { status: 503 },
    )
  }
}
