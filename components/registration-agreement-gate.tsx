'use client'

import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import Link from 'next/link'

export const REGISTRATION_AGREEMENT_VERSION = '2026-09-29-v2'

export function RegistrationAgreementGate({ children }: { children: ReactNode }) {
  const [readToEnd, setReadToEnd] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const onScroll = () => {
    const el = box.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) setReadToEnd(true)
  }

  return <div className="registration-gate">
    <section className="registration-agreement card">
      <p className="eyebrow">Required Before Registration</p>
      <h2>NDA, Terms And User Agreement</h2>
      <p className="muted">Read the agreement to the end before continuing. Registration is only available to adults aged 18 or older.</p>
      <div ref={box} className="registration-agreement-scroll" onScroll={onScroll} tabIndex={0} aria-label="Registration agreement">
        <h3>1. Purpose And Eligibility</h3>
        <p>The WTC Accra Hub is a professional trade, investment and business-networking platform. You confirm that you are at least 18 years old, have authority to provide the information submitted, and will use the platform only for lawful business purposes.</p>

        <h3>2. Confidentiality And NDA</h3>
        <p>Non-public deal information, financial information, documents, identities, contact details, meeting details, messages and other materials disclosed through restricted areas of the platform are confidential unless the disclosing party clearly states otherwise. You must use confidential information only to evaluate or progress the relevant business opportunity and must not disclose it to an unauthorised third party.</p>

        <h3>3. No Circumvention Or Misuse</h3>
        <p>You must not use information obtained through the platform to bypass WTC Accra-managed introductions, impersonate another participant, scrape restricted information, misrepresent your identity or authority, or misuse another member&apos;s confidential information.</p>

        <h3>4. Verification And Access</h3>
        <p>WTC Accra may request identity, organisation, membership, mandate, source-of-funds or other verification information. Access to deal details, networking, introductions, meetings and deal rooms may depend on your participant type, verification status and current annual access plan.</p>

        <h3>5. Deals And Success Fee</h3>
        <p>Posting a deal is free. Where a transaction results from a deal, request, match, introduction or connection facilitated through the platform, the applicable participant agrees to the stated 1% success fee on the value of the successfully closed transaction, subject to the final transaction documentation and any separate written engagement terms.</p>

        <h3>6. Platform Conduct</h3>
        <p>You are responsible for the accuracy of information you post and for conducting your own commercial, legal, financial, sanctions, regulatory and technical due diligence. WTC Accra may moderate, suspend, restrict or remove access where information is misleading, unlawful, abusive or creates material platform risk.</p>

        <h3>7. Communications And Monitoring</h3>
        <p>Deal requests, matchmaking requests, introductions and deal-room discussions may be visible to authorised WTC Accra Trade Officers, Verification Officers, Administrators and Super Administrators for facilitation, verification, audit, compliance and support purposes. Actions taken on monitored workflows may record the staff member and role responsible.</p>

        <h3>8. Electronic Records</h3>
        <p>You agree that account confirmations, requests, approvals, notices, audit events, electronic acceptance records and platform messages may be retained as business records subject to the Privacy Policy and applicable retention requirements.</p>

        <h3>9. Intellectual Property And Uploaded Content</h3>
        <p>You retain rights you hold in content you submit, while granting WTC Accra the limited rights necessary to host, process, display and transmit that content for operation of the platform. You must not upload material you are not authorised to use.</p>

        <h3>10. Privacy</h3>
        <p>Personal information is handled as described in the <Link href="/privacy" target="_blank">Privacy Policy</Link>. Verification data may be reviewed by authorised personnel and service providers where necessary to operate and secure the platform.</p>

        <h3>11. Availability And Liability</h3>
        <p>The platform supports introductions and deal workflows but does not guarantee that a transaction will close, that another participant will perform, or that information supplied by another user is complete. Each party remains responsible for its own professional advice and transaction decisions.</p>

        <h3>12. Acceptance</h3>
        <p>By accepting below and creating an account, you agree to this Registration Agreement, NDA, platform terms, the Privacy Policy, the Copyright and DMCA Policy, and any clearly disclosed plan and transaction terms applicable to your use of the platform.</p>
        <p><strong>End Of Agreement</strong></p>
      </div>
      {!readToEnd && <p className="field-help">Scroll to the end of the agreement to enable acceptance.</p>}
      <label className="consent-check registration-agreement-check">
        <input type="checkbox" checked={accepted} disabled={!readToEnd} onChange={e => setAccepted(e.target.checked)} />
        <span>I Have Read And Agree To The NDA, Terms, User Agreement, Privacy Policy And Applicable 1% Success Fee Terms.</span>
      </label>
    </section>

    {accepted
      ? <div className="registration-fields-unlocked">
          <input type="hidden" name="legalAgreementAccepted" value="yes" />
          <input type="hidden" name="legalAgreementVersion" value={REGISTRATION_AGREEMENT_VERSION} />
          {children}
        </div>
      : <div className="registration-locked-note" aria-live="polite">Registration fields unlock after you read and accept the agreement.</div>}
  </div>
}
