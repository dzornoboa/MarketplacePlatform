export type FxResult = {
  from: string
  to: string
  rate: number
  amount: number
  converted: number
  asOf?: string | null
}

export async function convertCurrency(amount: number | null, from: string, to = 'USD'): Promise<FxResult | null> {
  if (amount == null || !Number.isFinite(amount) || amount < 0) return null
  const source = from.trim().toUpperCase()
  const target = to.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(source) || !/^[A-Z]{3}$/.test(target)) return null
  if (source === target) return { from: source, to: target, rate: 1, amount, converted: amount }

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${source}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data = await response.json() as { rates?: Record<string, number>; time_last_update_utc?: string }
    const rate = Number(data.rates?.[target])
    if (!Number.isFinite(rate) || rate <= 0) return null
    return {
      from: source,
      to: target,
      rate,
      amount,
      converted: amount * rate,
      asOf: data.time_last_update_utc ?? null,
    }
  } catch {
    return null
  }
}
