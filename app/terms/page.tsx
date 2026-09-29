import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

export const metadata = {
  title: 'Registration Agreement, NDA And Platform Terms',
  description: 'Terms governing registration, confidentiality, deal access and use of the WTC Accra Hub.',
}

export default function TermsPage() {
  return <><PublicHeader /><main><section className="section"><article className="article-page">
    <p className="eyebrow">Legal And Platform Use</p>
    <h1 className="article-title">Registration Agreement, NDA And Platform Terms</h1>
    <p className="field-help">Version: 29 September 2026</p>
    <div className="prose">
      <p>The WTC Accra Hub is intended for adults participating in professional trade, investment and business activity. Registration is restricted to persons aged 18 or older.</p>
      <h2>Confidentiality And NDA</h2>
      <p>Restricted deal information, documents, identities, contact details, financial information, meeting information and deal-room communications are confidential unless clearly designated otherwise by the disclosing party. Users may use confidential information only to assess, negotiate or progress the relevant business opportunity and may not disclose it to unauthorised third parties.</p>
      <h2>Access, Verification And Monitoring</h2>
      <p>WTC Accra may verify identity, organisation, membership and other business information. Deal and matchmaking requests may be monitored by authorised Trade Officers, Verification Officers, Administrators and Super Administrators. Platform records may identify the staff member and role responsible for an approval or status change.</p>
      <h2>Posting, Access Plans And Success Fees</h2>
      <p>Account creation and deal posting are free. Some participant types require an annual access plan before restricted deal details, networking or meeting information are unlocked. A 1% success fee applies to successfully closed transactions arising from a deal, request, match, introduction or connection facilitated through the platform, subject to the applicable final transaction documentation and any separate written engagement terms.</p>
      <h2>No Circumvention And Appropriate Use</h2>
      <p>Users must not bypass managed introductions, scrape restricted information, impersonate another person, misuse confidential information, upload unlawful material or use the platform to facilitate prohibited activity.</p>
      <h2>Due Diligence And Transaction Responsibility</h2>
      <p>WTC Accra facilitates access, verification, matching and introductions but does not guarantee a transaction, investment return, counterparty performance or the completeness of another user&apos;s information. Participants remain responsible for their own legal, financial, tax, sanctions, regulatory, technical and commercial due diligence.</p>
      <h2>Electronic Acceptance And Records</h2>
      <p>Electronic acceptance, requests, approvals, notices, audit events and platform messages may be retained as business records in accordance with the Privacy Policy and applicable retention requirements.</p>
      <h2>Privacy And Intellectual Property</h2>
      <p>Use of personal information is described in the Privacy Policy. Users retain rights they hold in submitted content while granting WTC Accra the limited rights necessary to host, process, display and transmit it to operate the platform.</p>
      <h2>Changes</h2>
      <p>These terms may be updated as the platform, pricing, transaction workflow or applicable requirements change. Material changes may require renewed acceptance before continued use of restricted platform features.</p>
      <h2>Contact</h2>
      <p>Questions may be directed to World Trade Centre Accra at membership@wtcaccra.com.</p>
    </div>
  </article></section></main><PublicFooter /></>
}
