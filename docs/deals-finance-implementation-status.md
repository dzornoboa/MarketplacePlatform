# Deals & Finance control centre — implementation status

## Implemented on this branch
- Added an MFA-protected staff route at `/admin/deals-finance`, requiring finance, opportunities or verification capability.
- Added the staff navigation entry.
- Displays existing Deal Room counts, closed values and calculated success fees using the current `deal_rooms` data.
- Excludes non-USD amounts without a verified USD conversion from USD aggregates.
- Distinguishes **calculated success fees** from invoiced, paid, overdue and outstanding balances.
- Links staff to current approvals, introductions and payments pages.

## Not yet implemented (must not be presented as working)
The present repository uses `deal_rooms.success_fee_amount` as a closure calculation and `payments` for subscription/access payments. It does **not** establish a complete contract-backed success-fee debtor/payment ledger. Avoid asserting collections, invoices, overdue fees or enforcement until these are built and tested.

## Required backend change sequence
1. Draft and approve the legal success-fee agreement, including eligibility, actual realized-value bases, responsible debtor, timing and anti-circumvention rules. Include Ghana regulatory/tax review.
2. Add a versioned `success_fee_agreements` table with server-generated acceptance records, agreement version and actor identity.
3. Add `deal_closure_submissions`, evidence attachments and two-party confirmation, followed by staff verification. Do not close simply on an uncorroborated declared value.
4. Add `success_fee_obligations` with debtor, deal-room reference, currency, amount, status and unique idempotency reference.
5. Add `success_fee_invoices`, `success_fee_payments`, allocations, disputes, approved payment plans, fee adjustments and immutable ledger/audit events.
6. Calculate in privileged server/database functions with strict RLS and permission checks; prevent self-approval and enforce dual authorization for major waivers.
7. Verify Paystack callbacks server-side; add manual bank-transfer reconciliation and multi-currency handling without treating subscription payments as success fees.
8. Notify participants at invoice issue, 7 days before due, due date, 3/7/14/30 days overdue, with dispute and payment-plan exceptions.
9. Restrict new introductions after an authorized overdue-review decision, never block invoice access or valid disputes.
10. Implement migration for three public participant tiers: Investor (US$1,500 annual, 0% success), Business (free, 1%), WTC Accra/WTCA Member (free, 1%) while retaining internal membership subtype.
11. Add end-to-end RLS, authorization, concurrency, webhook replay, and accounting reconciliation tests and complete production rollout through approved migrations.

## Release safeguards
- This is an **initial dashboard implementation**, not end-to-end success-fee collection or enforcement.
- Do not merge without `npm run typecheck`, `npm run test:unit`, `npm run build`, permission review and stakeholder approval.
- All changes are on a feature branch; production billing and fee behavior are unchanged.
