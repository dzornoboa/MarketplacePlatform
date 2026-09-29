import { NextResponse } from 'next/server'
import countriesData from 'world-countries'

export const revalidate = 86400

type CurrencyInfo = { name?: string; symbol?: string }

export async function GET() {
  const countries = countriesData.flatMap(country => {
    const code = country.cca2?.toUpperCase()
    const name = country.name?.common?.trim()
    if (!code || !name) return []

    const root = country.idd?.root ?? ''
    const suffix = country.idd?.suffixes?.[0] ?? ''
    const callingCode = root && suffix ? `${root}${suffix}` : root || ''
    const entries = Object.entries((country.currencies ?? {}) as Record<string, CurrencyInfo>)
    const [currencyCode, currency] = entries[0] ?? ['USD', { name: 'US dollar', symbol: '$' }]

    return [{
      code,
      name,
      callingCode,
      currencyCode,
      currencyName: currency?.name ?? currencyCode,
      currencySymbol: currency?.symbol ?? currencyCode,
      flag: country.flag ?? '',
      region: country.region ?? '',
      subregion: country.subregion ?? '',
    }]
  }).sort((a, b) => a.name.localeCompare(b.name))

  const currencies = [...new Map(countries.map(country => [
    country.currencyCode,
    {
      code: country.currencyCode,
      name: country.currencyName,
      symbol: country.currencySymbol,
    },
  ])).values()].sort((a, b) => a.code.localeCompare(b.code))

  if (!currencies.some(item => item.code === 'USD')) {
    currencies.unshift({ code: 'USD', name: 'US dollar', symbol: '$' })
  }

  return NextResponse.json(
    { countries, currencies, defaultCurrency: 'USD' },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } },
  )
}
