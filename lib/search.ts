const stopWords = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'the', 'to', 'with'])

function words(text: string) {
  return text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').match(/[\p{L}\p{N}]+/gu) ?? []
}

function searchWords(text: string) {
  return [...new Set(words(text).filter(word => !stopWords.has(word)))]
}

function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]))
    }
    previous = current
  }
  return previous[b.length]
}

function relatedScore(query: string[], text: string) {
  const candidates = searchWords(text)
  return query.reduce((total, term) => {
    if (candidates.includes(term)) return total + 4
    if (term.length < 4) return total
    if (candidates.some(word => word.startsWith(term))) return total + 3
    const tolerance = term.length >= 8 ? 2 : 1
    return total + (candidates.some(word => Math.abs(word.length - term.length) <= tolerance && distance(term, word) <= tolerance) ? 2 : 0)
  }, 0)
}

export function containsSearchPhrase(query: string, text: string) {
  const phrase = words(query).join(' ')
  return Boolean(phrase) && ` ${words(text).join(' ')} `.includes(` ${phrase} `)
}

export function suggestSearchResults<T>(query: string, entries: T[], getText: (entry: T) => string, limit = 6): T[] {
  const queryWords = searchWords(query)
  if (!queryWords.length) return []
  return entries.map(entry => ({ entry, score: relatedScore(queryWords, getText(entry)) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.entry)
}
