'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { labelForParticipantType, membershipFees } from '@/lib/auth/access'

export function AccessPaymentPrompt({
  participantType,
  subscriptionStatus,
  hasActiveSubscription,
  fullAccess = false,
  verified = false,
}: {
  participantType: string | null
  subscriptionStatus: string | null | undefined
  hasActiveSubscription: boolean
  fullAccess?: boolean
  verified?: boolean
}) {
  const [open, setOpen] = useState(false)
  const fee = participantType ? membershipFees[participantType] : undefined
  const paidTier = typeof fee === 'number' && fee > 0

  useEffect(() => {
    if (!paidTier || fullAccess || hasActiveSubscription || (verified && subscriptionStatus === 'awaiting_approval') || subscriptionStatus === 'awaiting_approval') return
    const key = 'wtc-access-payment-prompt-dismissed'
    if (sessionStorage.getItem(key) !== '1') setOpen(true)
  }, [paidTier, fullAccess, verified, hasActiveSubscription, subscriptionStatus])

  if (!open || !paidTier || !participantType || fullAccess) return null

  const dismiss = () => {
    sessionStorage.setItem('wtc-access-payment-prompt-dismissed', '1')
    setOpen(false)
  }

  return <div className="access-payment-overlay" role="dialog" aria-modal="true" aria-labelledby="access-payment-title">
    <section className="card access-payment-modal">
      <p className="eyebrow">Optional After Registration</p>
      <h2 id="access-payment-title">Activate Full {labelForParticipantType(participantType)} Access</h2>
      <p>You joined for free. Your annual access plan is <strong>US${fee.toLocaleString()}/year</strong>. You can pay now to begin the activation process, or skip and pay later from Billing.</p>
      <p className="field-help">Until payment is confirmed and any required verification is approved, the platform will show limited deal discovery and keep restricted details and networking locked.</p>
      <div className="button-row">
        <Link className="button button-primary" href="/dashboard/billing" onClick={dismiss}>Pay Or Activate Now</Link>
        <button className="button button-outline" type="button" onClick={dismiss}>Skip For Now</button>
      </div>
    </section>
  </div>
}
