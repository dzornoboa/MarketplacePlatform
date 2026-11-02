export const investmentBands = [
  { code: 'up-to-5m', label: 'Up to US$5 Million', minExclusive: -1, maxInclusive: 5000000 },
  { code: '5m-to-10m', label: 'Above US$5 Million to US$10 Million', minExclusive: 5000000, maxInclusive: 10000000 },
  { code: '10m-to-50m', label: 'Above US$10 Million to US$50 Million', minExclusive: 10000000, maxInclusive: 50000000 },
  { code: 'above-50m', label: 'Above US$50 Million', minExclusive: 50000000, maxInclusive: null },
] as const

export type InvestmentBand = (typeof investmentBands)[number]['code']
export function investmentBandForUsd(value: number | null | undefined): InvestmentBand | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  return investmentBands.find(b => value > b.minExclusive && (b.maxInclusive === null || value <= b.maxInclusive))?.code ?? null
}
export const investmentBandTag = (band: InvestmentBand) => `investment-band:${band}`
