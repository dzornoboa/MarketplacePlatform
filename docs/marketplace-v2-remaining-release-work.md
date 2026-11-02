# Marketplace V2 release blockers — 2026-11-02

## Final commercial direction
- Investor: US$1,500 annual access plus **1% success fee** on eligible verified completed deals.
- Business: free access, 1% success fee.
- WTC Accra/WTCA Member: free access, 1% success fee; retain internal WTC Accra / WTCA membership source.
- A fee does not accrue just because a user selects a deal, investment mandate or tier. It accrues only on eligible verified completed value per agreement.
- An investor or WTC member can list an Investor Deal (capital available); a business or WTC member can list a Business Deal (capital sought). The listing intent, not the signup category, defines deal type.
- Bands: up to $5M; >$5M to $10M; >$10M to $50M; >$50M.

## Implemented in this branch
- Membership page restores the CMS hero and presents revised commercial model.
- Registration gathers amount band and saves it in Supabase user metadata.
- Profile editor displays and updates amount band from user metadata.
- Investor mandate permits range selection.
- New investment listings auto-tag from converted USD capital, and Opportunities has investment-size filter.
- Deal labels for offering/seeking investment.
- Admin Deal Rooms/Finance overview.

## Mandatory before production merge
1. Add validated, RLS-protected investment preference to the canonical profiles database and synchronize existing signup metadata and profile edits. User metadata alone is not a searchable public business directory field.
2. Implement authorized profile and investor/business search by investment band, account category, sector and country. Respect visibility and verification.
3. Extend and test listing intent rules so Investor/Business/WTC members can publish both Investor Deals and Business Deals where permitted.
4. Update Supabase pricing/subscription plans, signup triggers, marketplace access RLS, subscription RPCs, checkout, and the 1% success-fee engine for **all** participant categories; investor must no longer be exempt.
5. Build fee agreements, eligible completed-value verification, debtor/payer attribution, invoicing, ledger, payment proof, disputes, reminders and finance reconciliation; avoid double charging a deal unless contractually agreed.
6. Backfill classification tags for existing opportunities after converting original currency values reliably. Add missing FX handling and safety tests.
7. Verify deployed migration order and run npm run typecheck, npm run test:unit, npm run build, Supabase RLS tests, security scan and Vercel preview.
8. Confirm legal/regulatory approval for success-fee agreements and investment intermediation.

**Do not merge this branch while legacy billing rules remain in production**; the public copy explicitly marks commercial model as proposed.
