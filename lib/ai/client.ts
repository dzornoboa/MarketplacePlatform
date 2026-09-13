import Anthropic from '@anthropic-ai/sdk'

/* One Anthropic client for the whole app. Every AI feature degrades
   gracefully when ANTHROPIC_API_KEY is not set: the helper falls back to
   keyword answers, the insights page to rule-based commentary, and the
   super-admin agent shows a setup notice. */
export const AI_MODEL = 'claude-opus-5'

export function aiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

let client: Anthropic | null = null
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}
