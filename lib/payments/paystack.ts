/* Paystack is the provider for card and mobile-money (MTN, Vodafone, AirtelTigo)
   payments in Ghana. Nothing here runs unless PAYSTACK_SECRET_KEY is set, and
   the callback also needs SUPABASE_SERVICE_ROLE_KEY to record the result —
   members must never be able to mark their own payment as paid. */

export function paystackConfigured(): boolean {
  return !!process.env.PAYSTACK_SECRET_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

type InitializeResult = { authorizationUrl: string; accessCode: string; reference: string }

/* Amount is in the plan currency; Paystack GHS/USD accounts take minor units. */
export async function initializeTransaction(input: {
  email: string; amount: number; currency: string; reference: string; callbackUrl: string;
  channels?: Array<'card' | 'mobile_money' | 'bank'>; metadata?: Record<string, unknown>
}): Promise<InitializeResult> {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: input.channels,
      metadata: input.metadata,
    }),
  })
  const json = await res.json() as { status: boolean; message: string; data?: { authorization_url: string; access_code: string; reference: string } }
  if (!res.ok || !json.status || !json.data) throw new Error(json.message || 'Paystack did not accept the transaction')
  return { authorizationUrl: json.data.authorization_url, accessCode: json.data.access_code, reference: json.data.reference }
}

export async function verifyTransaction(reference: string): Promise<{ succeeded: boolean; providerReference: string; amount: number; currency: string }> {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: 'no-store',
  })
  const json = await res.json() as { status: boolean; data?: { status: string; id: number; amount: number; currency: string; reference: string } }
  if (!res.ok || !json.status || !json.data) return { succeeded: false, providerReference: reference, amount: 0, currency: '' }
  return {
    succeeded: json.data.status === 'success',
    providerReference: String(json.data.id),
    amount: json.data.amount / 100,
    currency: json.data.currency,
  }
}
