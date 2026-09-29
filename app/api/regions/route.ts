import { NextResponse } from 'next/server'

export const revalidate = 86400

type RestCountry = {
  cca2?: string
  name?: { common?: string }
  idd?: { root?: string; suffixes?: string[] }
}

export async function GET() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,idd', {
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`Country service returned ${response.status}`)
    const rows = await response.json() as RestCountry[]
    const countries = rows.flatMap(row => {
      const code = row.cca2?.toUpperCase()
      const name = row.name?.common?.trim()
      const root = row.idd?.root ?? ''
      const suffix = row.idd?.suffixes?.[0] ?? ''
      const callingCode = root && suffix ? `${root}${suffix}` : root || ''
      return code && name ? [{ code, name, callingCode }] : []
    }).sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ countries }, { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400' } })
  } catch {
    return NextResponse.json({
      countries: [
        { code: 'GH', name: 'Ghana', callingCode: '+233' },
        { code: 'US', name: 'United States', callingCode: '+1' },
        { code: 'GB', name: 'United Kingdom', callingCode: '+44' },
      ],
      degraded: true,
    })
  }
}
