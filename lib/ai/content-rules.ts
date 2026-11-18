export const moderationReasons = ['sexual_content', 'harassment', 'profanity', 'suspected_fraud', 'defamation_risk'] as const
export type ModerationReason = (typeof moderationReasons)[number]

export function obviousViolation(text: string): ModerationReason | null {
  const normalized = text.normalize('NFKC').replace(/\p{Cf}/gu, '').toLowerCase()
  if (/\b(?:fuck(?:ed|ing|er|ers)?|shit(?:ty)?|bitch(?:es)?|asshole(?:s)?)\b/.test(normalized)) return 'profanity'
  if (/\b(?:you are|you're|youre)\s+(?:(?:an?|such an?)\s+)?(?:idiot|moron|loser|scum)\b/.test(normalized)) return 'harassment'
  if (/\b(?:send|sell|buy|trade)\s+(?:me\s+)?(?:your\s+)?(?:nudes?|porn)\b/.test(normalized)) return 'sexual_content'
  if (/\b(?:guaranteed|risk[- ]free)\s+(?:daily|weekly)\s+(?:returns?|profits?)\b/.test(normalized)) return 'suspected_fraud'
  return null
}

export function parseModerationResult(text: string): 'allow' | ModerationReason | null {
  const value = text.trim()
  return value === 'allow' ? value : moderationReasons.find(reason => reason === value) ?? null
}
