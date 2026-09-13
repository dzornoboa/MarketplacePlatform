import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUserProfile } from '@/lib/auth/guards'
import { SubmitButton } from '@/components/submit-button'
import { humanize } from '@/lib/auth/access'
import { money } from '@/lib/format'
import { completeTestPayment } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

/* Simulated card / mobile-money checkout used while payment_mode is 'test'.
   It looks like a gateway page so the whole journey can be walked end to
   end; the real provider replaces it when the keys are set and the mode is
   switched to live in the editor settings. */
export default async function CheckoutPage({ searchParams }: Props) {
  const { supabase } = await requireUserProfile()
  const params = await searchParams
  const ref = typeof params.ref === 'string' ? params.ref : ''
  if (!ref) redirect('/dashboard/billing')

  const { data: payment } = await supabase.from('payments').select('*').eq('reference', ref).maybeSingle()
  if (!payment) redirect('/dashboard/billing?error=' + encodeURIComponent('Payment not found.'))
  if (payment.status !== 'pending') redirect('/dashboard/billing?message=' + encodeURIComponent(`This payment is already ${humanize(payment.status)}.`))

  const [{ data: plan }, { data: saved }, { data: billing }] = await Promise.all([
    payment.plan_code ? supabase.from('subscription_plans').select('name').eq('code', payment.plan_code).maybeSingle() : Promise.resolve({ data: null }),
    payment.payment_method_id ? supabase.from('payment_methods').select('*').eq('id', payment.payment_method_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('billing_addresses').select('*').maybeSingle(),
  ])
  const momo = payment.method === 'mobile_money'

  return <div className="page-stack checkout-page">
    <div>
      <p className="eyebrow">Secure checkout · test mode</p>
      <h1>{momo ? 'Pay with mobile money' : 'Pay with card'}</h1>
      <p className="muted">No money moves in test mode. Completing this page records the payment exactly as the provider would and activates the subscription.</p>
    </div>

    <section className="card checkout-card">
      <dl className="detail-grid detail-grid-two">
        <div><dt>Plan</dt><dd>{plan?.name ?? payment.plan_code}</dd></div>
        <div><dt>Amount</dt><dd><strong className="plan-price">{money(payment.amount, payment.currency)}</strong></dd></div>
        <div><dt>Reference</dt><dd className="pay-reference">{payment.reference}</dd></div>
        <div><dt>Method</dt><dd>{humanize(payment.method)}</dd></div>
        {billing && <div><dt>Billed to</dt><dd>{billing.billing_name}{billing.company ? ` · ${billing.company}` : ''}<br /><small className="muted">{[billing.line1, billing.city, billing.country].filter(Boolean).join(', ')}</small></dd></div>}
      </dl>

      <form action={completeTestPayment} className="form-stack">
        <input type="hidden" name="paymentId" value={payment.id} />
        {momo
          ? <>
              <label>Network<select name="network" defaultValue={saved?.momo_network === 'Telecel' ? 'vodafone' : saved?.momo_network === 'AirtelTigo' ? 'airteltigo' : 'mtn'}><option value="mtn">MTN Mobile Money</option><option value="vodafone">Telecel Cash</option><option value="airteltigo">AirtelTigo Money</option></select></label>
              <label>Mobile money number<input name="phone" inputMode="tel" placeholder="024 000 0000" defaultValue={saved?.momo_number ?? ''} /></label>
              {saved && <p className="field-help">Using your saved {saved.momo_network} number. <Link className="arrow-link" href="/dashboard/billing#payment-details">Change →</Link></p>}
              <p className="field-help">In live mode a prompt is sent to this number to approve the payment.</p>
            </>
          : <>
              {saved
                ? <p className="pay-saved-card"><strong>{saved.brand} •••• {saved.last4}</strong> · expires {String(saved.exp_month).padStart(2, '0')}/{saved.exp_year} · {saved.holder_name}<br /><small className="muted">Saved card. <Link className="arrow-link" href="/dashboard/billing#payment-details">Use a different card →</Link></small></p>
                : <label>Card number<input name="card" inputMode="numeric" placeholder="4242 4242 4242 4242" /></label>}
              <div className="split-grid">
                {!saved && <label>Expiry<input name="expiry" placeholder="MM / YY" /></label>}
                <label>CVC<input name="cvc" inputMode="numeric" placeholder="123" /></label>
              </div>
              <p className="field-help">Test mode: any values are accepted and nothing is stored.</p>
            </>}
        <div className="button-row">
          <SubmitButton name="outcome" value="success" pendingLabel="Processing…">Pay {money(payment.amount, payment.currency)}</SubmitButton>
          <SubmitButton name="outcome" value="cancel" className="button button-outline" pendingLabel="Cancelling…">Cancel</SubmitButton>
        </div>
      </form>
    </section>
    <p className="field-help"><Link className="arrow-link" href="/dashboard/billing">← Back to billing</Link></p>
  </div>
}
