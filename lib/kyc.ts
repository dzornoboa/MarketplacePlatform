/* Know-your-customer requirements shared by billing, verification, the
   documents page and the console. Mirrors public.payment_readiness() in the
   database, which is the enforcement point (no payment row without them). */

export const COMPANY_TYPES = new Set(['business', 'wtc_association_member', 'wtc_accra_member', 'project_sponsor', 'institutional_partner'])

export const DOCUMENT_PURPOSES = ['identity', 'business_certificate', 'tax_document', 'proof_of_address', 'proof_of_funds', 'profile', 'financials', 'supporting', 'general', 'other'] as const
export type DocumentPurpose = (typeof DOCUMENT_PURPOSES)[number]

export const purposeLabels: Record<DocumentPurpose, string> = {
  identity: 'Identity document (passport, national ID, licence)',
  business_certificate: 'Business registration certificate',
  tax_document: 'Tax document (TIN certificate / tax clearance)',
  proof_of_address: 'Company address proof (utility bill, lease, bank letter)',
  proof_of_funds: 'Proof of funds (bank statement or letter)',
  profile: 'Company profile',
  financials: 'Financial statements',
  supporting: 'Other supporting document',
  general: 'General',
  other: 'Other',
}
export const purposeLabel = (p: string) => (purposeLabels as Record<string, string>)[p] ?? p.replaceAll('_', ' ')

/* Company rules also apply to buyers and investors who registered an organisation. */
export function isCompanyType(type: string | null | undefined, hasOrganisation = false): boolean {
  return !!type && (COMPANY_TYPES.has(type) || (hasOrganisation && (type === 'buyer' || type === 'investor')))
  // Investors registering as a firm follow the company rules; individuals do not.
}

/* Documents a participant type must upload before paying or verifying. */
export function requiredDocuments(type: string | null | undefined, hasOrganisation = false): DocumentPurpose[] {
  return isCompanyType(type, hasOrganisation) ? ['business_certificate', 'tax_document', 'proof_of_address', 'identity'] : ['identity', 'proof_of_funds']
}

export const requirementNote = (type: string | null | undefined, hasOrganisation = false) => isCompanyType(type, hasOrganisation)
  ? 'Companies and institutions upload the business registration certificate, a tax document, proof of the company address and an identity document for the contact person.'
  : 'Individuals upload an identity document and proof of funds. Other supporting documents are welcome.'

export type KycStep = { key: string; label: string; done: boolean; href: string }

/* Checklist rendered on billing, verification and the dashboard. */
export function kycChecklist(opts: { type: string | null | undefined; purposes: string[]; hasBillingAddress: boolean; hasOrganisation: boolean; verified?: boolean }): { steps: KycStep[]; ready: boolean } {
  const company = isCompanyType(opts.type, opts.hasOrganisation)
  const has = new Set(opts.purposes)
  const steps: KycStep[] = []
  if (company) steps.push({ key: 'organisation', label: 'Add your organisation (name, registration number, address)', done: opts.hasOrganisation, href: '/dashboard/organisation' })
  steps.push({ key: 'billing_address', label: 'Enter your billing address', done: opts.hasBillingAddress, href: '/dashboard/billing#payment-details' })
  if (opts.verified) {
    // WTC Accra has reviewed this member's documents already.
    steps.push({ key: 'documents', label: 'Documents reviewed by WTC Accra', done: true, href: '/dashboard/documents' })
  } else {
    for (const p of requiredDocuments(opts.type, opts.hasOrganisation)) {
      steps.push({ key: p, label: `Upload: ${purposeLabel(p)}${p === 'identity' && company ? ' — contact person' : ''}`, done: has.has(p), href: `/dashboard/documents?purpose=${p}` })
    }
  }
  return { steps, ready: steps.every(s => s.done) }
}
