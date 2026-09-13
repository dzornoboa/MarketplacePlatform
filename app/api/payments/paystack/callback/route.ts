import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabasePublicConfig } from '@/lib/supabase/config'
import { verifyTransaction } from '@/lib/payments/paystack'

/* Paystack sends the member back here after checkout. The result is never
   trusted from the querystring: the transaction is re-verified with Paystack
   using the secret key, and the payment row is updated through a service-role
   client, because members must not be able to mark themselves as paid. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get('reference') ?? request.nextUrl.searchParams.get('trxref')
  const billing = new URL('/dashboard/billing', request.url)
  if (!reference) { billing.searchParams.set('error', 'Payment reference missing.'); return NextResponse.redirect(billing) }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!process.env.PAYSTACK_SECRET_KEY || !serviceKey) {
    billing.searchParams.set('error', 'Online payment is not configured. Your reference is ' + reference + ' — WTC Accra finance can confirm it manually.')
    return NextResponse.redirect(billing)
  }

  const result = await verifyTransaction(reference)
  const { url } = getSupabasePublicConfig()
  const admin = createSupabaseClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  await admin.rpc('record_provider_payment', { payment_reference: reference, provider_ref: result.providerReference, succeeded: result.succeeded })

  billing.searchParams.set(result.succeeded ? 'message' : 'error',
    result.succeeded ? 'Payment received. Your subscription is now active.' : 'The payment was not completed. You can try again or pay by bank transfer.')
  return NextResponse.redirect(billing)
}
