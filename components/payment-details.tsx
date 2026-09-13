'use client'

import { useState } from 'react'
import type { Database } from '@/lib/database.types'
import { SubmitButton } from '@/components/submit-button'
import { saveBillingAddress, savePaymentMethod, setPrimaryPaymentMethod, removePaymentMethod } from '@/app/dashboard/billing/methods'

type Address = Database['public']['Tables']['billing_addresses']['Row']
type Method = Database['public']['Tables']['payment_methods']['Row']
type Kind = 'card' | 'mobile_money' | 'bank_transfer'

const YEARS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() + i)

export function methodTitle(m: Method): string {
  if (m.kind === 'card') return `${m.brand ?? 'Card'} •••• ${m.last4 ?? '????'}`
  if (m.kind === 'mobile_money') return `${m.momo_network ?? 'Mobile money'} ${m.momo_number ? `•••• ${m.momo_number.slice(-4)}` : ''}`
  return `Bank transfer${m.bank_name ? ` · ${m.bank_name}` : ''}`
}

/* Billing address + saved payment methods. Members add cards (stored as
   brand/last4/expiry only), mobile-money numbers or a bank, edit them, pick
   a primary, and remove them. The checkout uses the primary method. */
export function PaymentDetails({ address, methods }: { address: Address | null; methods: Method[] }) {
  const [editing, setEditing] = useState<Method | null>(null)
  const [adding, setAdding] = useState(methods.length === 0)
  const [kind, setKind] = useState<Kind>('card')
  const openAdd = (k: Kind) => { setEditing(null); setKind(k); setAdding(true) }
  const openEdit = (m: Method) => { setEditing(m); setKind(m.kind as Kind); setAdding(true) }
  const close = () => { setAdding(false); setEditing(null) }

  return <section className="card" id="payment-details">
    <h2>Payment details</h2>
    <p className="muted">Your billing address appears on receipts. Saved payment methods make checkout quicker; the primary one is used by default.</p>

    <div className="split-grid pay-details-grid">
      <form action={saveBillingAddress} className="form-stack">
        <h3>Billing address</h3>
        <div className="form-grid">
          <label>Name on invoice<input name="billingName" defaultValue={address?.billing_name ?? ''} required /></label>
          <label>Company (optional)<input name="company" defaultValue={address?.company ?? ''} /></label>
        </div>
        <div className="form-grid">
          <label>Billing email<input name="email" type="email" defaultValue={address?.email ?? ''} /></label>
          <label>Phone<input name="phone" defaultValue={address?.phone ?? ''} /></label>
        </div>
        <label>Address line 1<input name="line1" defaultValue={address?.line1 ?? ''} required /></label>
        <label>Address line 2<input name="line2" defaultValue={address?.line2 ?? ''} /></label>
        <div className="form-grid">
          <label>City<input name="city" defaultValue={address?.city ?? ''} required /></label>
          <label>Region / state<input name="region" defaultValue={address?.region ?? ''} /></label>
        </div>
        <div className="form-grid">
          <label>Postal code<input name="postalCode" defaultValue={address?.postal_code ?? ''} /></label>
          <label>Country<input name="country" defaultValue={address?.country ?? 'Ghana'} required /></label>
        </div>
        <label>Tax ID / TIN (optional)<input name="taxId" defaultValue={address?.tax_id ?? ''} /></label>
        <div><SubmitButton pendingLabel="Saving…">{address ? 'Update address' : 'Save address'}</SubmitButton></div>
      </form>

      <div className="form-stack">
        <h3>Payment methods</h3>
        {methods.length === 0 && !adding && <p className="muted">No payment method saved yet.</p>}
        {methods.map(m => <div className={m.is_primary ? 'pay-method-row pay-method-primary' : 'pay-method-row'} key={m.id}>
          <div>
            <strong>{methodTitle(m)}</strong>{m.is_primary && <span className="status-dot status-verified">Primary</span>}
            <p className="muted">{m.label ? `${m.label} · ` : ''}{m.kind === 'card' ? `Expires ${String(m.exp_month).padStart(2, '0')}/${m.exp_year} · ${m.holder_name ?? ''}` : m.holder_name ?? ''}</p>
          </div>
          <div className="button-row">
            <button type="button" className="button button-outline" onClick={() => openEdit(m)}>Edit</button>
            {!m.is_primary && <form action={setPrimaryPaymentMethod}><input type="hidden" name="methodId" value={m.id} /><SubmitButton className="button button-outline" pendingLabel="Saving…">Set as primary</SubmitButton></form>}
            <form action={removePaymentMethod} onSubmit={e => { if (!confirm('Remove this payment method?')) e.preventDefault() }}><input type="hidden" name="methodId" value={m.id} /><SubmitButton className="button button-danger" pendingLabel="Removing…">Remove</SubmitButton></form>
          </div>
        </div>)}

        {!adding && <div className="button-row">
          <button type="button" className="button button-primary" onClick={() => openAdd('card')}>+ Add card</button>
          <button type="button" className="button button-outline" onClick={() => openAdd('mobile_money')}>+ Add mobile money</button>
          <button type="button" className="button button-outline" onClick={() => openAdd('bank_transfer')}>+ Add bank</button>
        </div>}

        {adding && <form action={savePaymentMethod} className="form-stack pay-method-form">
          <h3>{editing ? `Edit ${methodTitle(editing)}` : 'New payment method'}</h3>
          {editing && <input type="hidden" name="methodId" value={editing.id} />}
          <input type="hidden" name="kind" value={kind} />
          {!editing && <div className="pay-methods">
            {(['card', 'mobile_money', 'bank_transfer'] as Kind[]).map(k => <label className="pay-method" key={k}><input type="radio" name="kindPick" checked={kind === k} onChange={() => setKind(k)} /> <span><strong>{k === 'card' ? 'Card' : k === 'mobile_money' ? 'Mobile money' : 'Bank transfer'}</strong><small>{k === 'card' ? 'Visa · Mastercard · Verve' : k === 'mobile_money' ? 'MTN · Telecel · AirtelTigo' : 'Pay from your bank'}</small></span></label>)}
          </div>}
          <label>Label (optional)<input name="label" placeholder="e.g. Company card" defaultValue={editing?.label ?? ''} /></label>
          {kind === 'card' && <>
            <label>Name on card<input name="holderName" defaultValue={editing?.holder_name ?? ''} required /></label>
            <label>Card number{editing && <small> — leave blank to keep •••• {editing.last4}</small>}<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" required={!editing} /></label>
            <div className="form-grid">
              <label>Expiry month<select name="expMonth" defaultValue={editing?.exp_month ?? ''} required><option value="" disabled>MM</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}</select></label>
              <label>Expiry year<select name="expYear" defaultValue={editing?.exp_year ?? ''} required><option value="" disabled>YYYY</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></label>
            </div>
            <p className="field-help">We keep only the card brand, last four digits and expiry. The full number and CVC are never stored; the CVC is asked for at checkout.</p>
          </>}
          {kind === 'mobile_money' && <>
            <label>Network<select name="momoNetwork" defaultValue={editing?.momo_network ?? 'MTN'}><option>MTN</option><option>Telecel</option><option>AirtelTigo</option></select></label>
            <label>Mobile-money number<input name="momoNumber" inputMode="tel" defaultValue={editing?.momo_number ?? ''} required placeholder="024 000 0000" /></label>
            <label>Account name<input name="holderName" defaultValue={editing?.holder_name ?? ''} /></label>
          </>}
          {kind === 'bank_transfer' && <>
            <label>Bank<input name="bankName" defaultValue={editing?.bank_name ?? ''} required placeholder="e.g. GCB Bank" /></label>
            <label>Account name<input name="holderName" defaultValue={editing?.holder_name ?? ''} /></label>
            <p className="field-help">Bank transfers are confirmed by WTC Accra finance against your payment reference.</p>
          </>}
          <label className="switch"><input type="checkbox" name="makePrimary" defaultChecked={methods.length === 0 || !!editing?.is_primary} /> Use as my primary payment method</label>
          <div className="button-row">
            <SubmitButton pendingLabel="Saving…">{editing ? 'Save changes' : 'Save payment method'}</SubmitButton>
            <button type="button" className="button button-outline" onClick={close}>Cancel</button>
          </div>
        </form>}
      </div>
    </div>
  </section>
}
