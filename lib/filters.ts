// Quote the entire pattern for PostgREST's logical filter grammar. Escape
// SQL LIKE metacharacters separately so a search remains literal.
export function containsPattern(value: string): string {
  return '%' + value.trim().replace(/[\\%_]/g, c => '\\' + c) + '%'
}

export function searchColumns(value: string, columns: readonly string[]): string {
  const pattern = JSON.stringify(containsPattern(value).replaceAll('*', '\\*'))
  return columns.map(column => `${column}.ilike.${pattern}`).join(',')
}

export function filterOptions(values: readonly (string | null | undefined)[], selected = ''): string[] {
  return [...new Set([...values, selected].filter((value): value is string => !!value?.trim()))]
    .sort((a, b) => a.localeCompare(b))
}

export const opportunityKinds = ['investment', 'trade', 'procurement', 'partnership'] as const

export function opportunityKind(value: unknown) {
  return opportunityKinds.find(kind => kind === value) ?? ''
}
