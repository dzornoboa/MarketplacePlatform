# WTC Accra Marketplace — Proposed Three-Tier Commercial Model

**Status:** Draft for review  
**Purpose:** Business-model and implementation documentation only. No production pricing or access logic is changed by this document.

## 1. Objective

Simplify the WTC Accra marketplace into three clear participant categories while keeping deal discovery, matching, verification, introductions, Deal Rooms, auditability and success-fee tracking easy to understand.

The proposed commercial categories are:

1. **Investor**
2. **Business**
3. **WTC Member** — covering both **WTC Accra Members** and **WTCA Members**

WTC Accra and WTCA membership identities should remain distinguishable internally for verification, badges, reporting and administration, but commercially they should sit under one **WTC Member** marketplace tier.

---

## 2. Proposed Commercial Model

| Marketplace Tier | Platform / Joining Fee | Posting | Marketplace Access | Success Fee |
| --- | ---: | --- | --- | ---: |
| **Investor** | **US$1,500** | Can post investment mandates / capital deployment opportunities | Full investor marketplace access after payment and verification | **0%** |
| **Business** | **Free** | Can post deals / opportunities seeking capital, buyers, suppliers or partners | Access subject to profile and verification rules | **1% of closed deal value** |
| **WTC Member** | **Free** | Can post deals, opportunities and member-to-member requirements | Access after membership validation / verification | **1% of closed deal value** |

### Commercial principle

- **Investors pay for access to the platform and deal flow.**
- **Businesses pay only when value is successfully created through a closed deal.**
- **WTC Accra / WTCA Members join free and pay only when a deal is successfully closed.**
- Registration can remain free for all participant types, but Investor full access is activated only after the US$1,500 fee is paid and the account is approved.

---

## 3. Investor Model

### 3.1 Investor fee

**Annual / access fee:** US$1,500

The Investor fee provides access to:

- Verified business opportunities
- WTC member opportunities
- Deal discovery
- Investor mandate posting
- AI / rule-based matching
- Managed introductions
- Deal Rooms
- Saved opportunities
- Match tracking
- Direct or managed networking subject to approval rules
- Reports and activity history

### 3.2 Investor postings

Investors should be able to publish an **Investment Mandate**, for example:

- Looking to invest up to US$5 million
- Looking to invest US$5–10 million
- Looking to invest US$10–50 million
- Looking to invest US$50 million+
- Sector-specific investment mandate
- Country / regional mandate
- Equity mandate
- Debt mandate
- Joint venture / strategic investment mandate
- Acquisition mandate

An Investor posting is not necessarily a request for funding. It represents **capital available or an investment appetite**.

### 3.3 Investor success fee

Under the proposed model in this document:

**Investor success fee: 0%**

The Investor's commercial obligation is the US$1,500 platform/access fee.

---

## 4. Business Model

### 4.1 Joining fee

**Free**

Businesses should be able to register, complete their profile and publish opportunities without paying an annual membership fee.

### 4.2 Business use cases

Businesses may post:

- Seeking Investment
- Seeking Buyers
- Seeking Suppliers
- Seeking Distributors
- Procurement Opportunities
- Export Opportunities
- Partnership Opportunities
- Joint Ventures
- Expansion Opportunities
- Project Finance
- M&A / acquisition opportunities
- Technology / licensing opportunities

### 4.3 Business success fee

**1% of the final closed deal value**

Example:

| Closed Deal Value | Success Fee |
| ---: | ---: |
| US$250,000 | US$2,500 |
| US$1,000,000 | US$10,000 |
| US$5,000,000 | US$50,000 |
| US$10,000,000 | US$100,000 |
| US$20,000,000 | US$200,000 |

The fee should only become payable when a deal is formally marked **Closed / Successful** through the platform's Deal Room workflow.

---

## 5. WTC Member Model

### 5.1 Commercial category

The marketplace should expose one commercial category:

**WTC Member**

Internally, the platform should preserve the membership source:

- WTC Accra Member
- WTCA Member

This allows:

- Correct member verification
- Correct badges
- Member-directory filtering
- WTC Accra vs WTCA reporting
- Membership ID validation
- Reciprocal member privileges
- Future WTC-specific benefits

### 5.2 Joining fee

**Free**

### 5.3 Success fee

**1% of the final closed deal value**

### 5.4 WTC Member opportunities

WTC Members may post:

- Investment opportunities
- Trade opportunities
- Buyer requests
- Supplier requests
- Import / export requirements
- Partnership opportunities
- Joint ventures
- Market-entry requests
- Distributor searches
- Procurement
- Business expansion
- Introductions and partnership requests

---

## 6. Deal-Value Classification

The platform should classify opportunities and mandates by deal size so discovery and matching are easier.

### Recommended bands

| Band | Deal / Investment Size |
| --- | --- |
| **Tier A** | Up to US$5 million |
| **Tier B** | Above US$5 million up to US$10 million |
| **Tier C** | Above US$10 million up to US$50 million |
| **Tier D** | US$50 million and above |

These bands are **opportunity classifications**, not separate membership plans.

They should be used for:

- Search
- Matching
- Investor mandates
- Reports
- Deal pipeline analysis
- Dashboard KPIs
- Notifications
- Recommended opportunities

### Why keep deal bands separate from membership pricing

A US$50 million investor mandate should not require a different account type from a US$5 million mandate.

The user's **marketplace tier** answers:

> Who are you?

The **deal-value band** answers:

> What size opportunity are you looking for or offering?

Keeping these separate makes the system simpler and more scalable.

---

## 7. Alternative Success-Fee Schedule For Future Review

An earlier concept considered a stepped success-fee schedule:

- Up to US$5 million — 1%
- Above US$5 million up to US$10 million — 1.5%
- US$15 million / higher-value deals — 2%

This document does **not** recommend implementing that schedule yet because the latest commercial direction is:

- Investor — US$1,500 access fee, no success fee
- Business — free, 1% success fee
- WTC Member — free, 1% success fee

If WTC Accra later wants a tiered success fee, it should be handled as a configurable fee policy rather than hard-coded into individual pages.

---

## 8. Marketplace Access Rules

### Investor

1. Create account
2. Select Investor
3. Complete profile
4. Complete identity / organisation verification
5. Pay US$1,500
6. WTC Accra approves where required
7. Full Investor dashboard opens
8. Investor may browse deals and publish investment mandates

### Business

1. Create account free
2. Select Business
3. Complete profile
4. Submit verification
5. Post deals free
6. Browse permitted marketplace content
7. Request connection / introduction
8. WTC Accra monitors matchmaking
9. Deal proceeds through Deal Room
10. 1% success fee is generated when deal closes

### WTC Member

1. Create account free
2. Select WTC Member
3. Choose / validate membership source:
   - WTC Accra
   - WTCA
4. Validate membership ID / email / organisation
5. Complete profile
6. Enter marketplace
7. Post opportunities free
8. Request connections / introductions
9. Complete transactions through Deal Rooms
10. 1% success fee is generated when deal closes

---

## 9. Deal Lifecycle

Every deal should follow a consistent trackable lifecycle.

### Stage 1 — Opportunity Posted

A Business, WTC Member or Investor creates a posting.

Required core data:

- Title
- Deal type
- Sector
- Country
- Region
- Currency
- Deal / investment value
- Deal-value band
- Summary
- Detailed description
- Requirements
- Deadline
- Tags

### Stage 2 — WTC Review

Where moderation is required:

- Trade Officer
- Verification Officer
- Administrator
- Super Administrator

may review the opportunity before publication.

### Stage 3 — Matching

The platform matches:

- Investor mandates ↔ Business deals
- Investor mandates ↔ WTC Member deals
- Business requirements ↔ WTC Member opportunities
- WTC Member ↔ WTC Member opportunities

Matching signals may include:

- Deal size
- Sector
- Country
- Region
- Investment type
- Preferred currency
- Tags
- Participant type
- Investor mandate
- Business requirement

### Stage 4 — Access / Introduction Request

A user requests access to a matched party or opportunity.

The request is monitored by WTC Accra staff.

### Stage 5 — Introduction Approved

Once approved:

- Parties can communicate
- A Deal Room can be opened
- WTC staff remain copied / visible where required

### Stage 6 — Deal In Progress

The Deal Room should track:

- Participants
- Messages
- Documents
- Meetings
- Milestones
- Status
- Notes
- Responsible WTC staff
- Audit history

### Stage 7 — Deal Closed

An authorized WTC staff member records:

- Final deal value
- Transaction currency
- USD equivalent
- FX rate
- Closed date
- Closing note
- Parties
- Success-fee payer
- Success-fee percentage
- Success-fee amount

### Stage 8 — Success Fee

If payer is:

- **Investor:** US$0 success fee
- **Business:** 1%
- **WTC Member:** 1%

The system creates a fee / invoice record and tracks:

- Due
- Paid
- Part-paid
- Waived
- Overdue
- Refunded / adjusted

---

## 10. Determining Who Pays The Success Fee

The system should not blindly charge every party in a Deal Room.

Each closed deal should identify a **success-fee liable party**.

Default policy:

### Investor + Business

- Investor: no success fee
- Business: 1%

### Investor + WTC Member

- Investor: no success fee
- WTC Member: 1%

### Business + WTC Member

Recommended rule:

- The party that **posted the deal / opportunity** pays the 1% fee, unless WTC Accra overrides the payer in the Deal Room.

### WTC Member + WTC Member

Recommended rule:

- Opportunity owner pays 1%, unless otherwise agreed and recorded.

### Business + Business

Recommended rule:

- Opportunity owner pays 1%.

This avoids automatically charging both sides 1% unless WTC Accra intentionally chooses a two-sided commission model.

---

## 11. Fee Calculation

### Formula

**Success Fee = Final Closed Deal Value × Applicable Success-Fee Rate**

For Business / WTC Member:

**Success Fee = Closed Deal Value × 1%**

Example:

Final Deal Value = US$8,000,000

Success Fee:

US$8,000,000 × 0.01 = **US$80,000**

### Multi-currency handling

The platform should retain:

- Original deal currency
- Original closed value
- USD equivalent
- FX rate
- FX date
- Success fee in original currency
- Success fee equivalent in USD

This aligns with the global country/currency work already present in the platform.

---

## 12. Proposed Participant Structure

### Public / commercial participant type

The user should choose one of only:

- Investor
- Business
- WTC Member

### Internal WTC Member subtype

If WTC Member is selected:

- WTC Accra Member
- WTCA Member

This subtype should not create a separate commercial pricing card.

It remains an identity / verification classification.

---

## 13. Dashboard Direction

All three participant categories can keep the LinkedIn-style member dashboard design already being developed, but modules should differ by role.

### Investor Dashboard

Primary modules:

- Investment Mandates
- Recommended Deals
- Saved Deals
- Matches
- Introductions
- Deal Rooms
- Messages
- Network
- Reports
- Investor Profile
- Billing / US$1,500 Access
- Notifications

Suggested KPIs:

- Active Mandates
- Recommended Deals
- Match Requests
- Introductions
- Active Deal Rooms
- Closed Investments
- Capital Deployed
- Countries / Sectors

### Business Dashboard

Primary modules:

- My Deals
- Recommended Investors
- Recommended WTC Members
- Matches
- Introductions
- Deal Rooms
- Messages
- Network
- Reports
- Success Fees
- Notifications

Suggested KPIs:

- Published Deals
- Total Capital Sought
- Match Requests
- Investor Matches
- Introductions
- Active Deal Rooms
- Closed Deals
- Success Fees Due / Paid

### WTC Member Dashboard

Primary modules:

- My Opportunities
- Investor Opportunities
- Business Opportunities
- WTC Network
- Matches
- Introductions
- Deal Rooms
- Messages
- Member Directory
- Reports
- Success Fees
- Notifications

Suggested KPIs:

- Published Opportunities
- Matches
- Introductions
- Active Deal Rooms
- Closed Deals
- Success Fees Due
- Member Connections
- Countries Reached

---

## 14. Administrative Workflow

### Trade Officer

- Opportunity review
- Matching
- Introductions
- Deal Rooms
- Closed-deal review
- Reports

### Verification Officer

- Participant verification
- WTC membership validation
- Business verification
- Investor verification
- User management

### Finance

- Investor US$1,500 payments
- Success-fee invoices
- Success-fee payment confirmation
- Outstanding fees
- Revenue reports

### Administrator

- Operational administration
- Users
- Listings
- Deals
- Finance visibility
- Reports
- Staff workflows

### Super Administrator

- All Administrator functions
- Role administration
- Fee-policy configuration
- Pricing configuration
- Success-fee overrides
- Audit logs
- Backup / restore
- Security
- Permanent deletion approval

---

## 15. Required Finance Records

The platform should eventually maintain separate financial records for:

### Investor Access Fee

- Investor
- Amount: US$1,500
- Payment reference
- Status
- Payment date
- Access start
- Access expiry, if annual
- Receipt / invoice

### Success Fee

- Deal Room
- Opportunity
- Liable participant
- Closed deal value
- Currency
- USD value
- Fee rate
- Fee amount
- Due date
- Payment status
- Payment reference
- Invoice
- Confirmed by
- Notes

---

## 16. Proposed Fee Statuses

Success fees should use a dedicated lifecycle such as:

- Calculated
- Invoiced
- Due
- Part Paid
- Paid
- Overdue
- Waived
- Disputed
- Refunded / Adjusted

Closing a Deal Room should not automatically mark the success fee as paid.

It should **calculate the obligation**, then Finance manages settlement.

---

## 17. Deal Closure Controls

A deal should only be closed by authorized staff or through a controlled confirmation process.

Recommended controls:

1. Deal participant submits “Deal Completed”
2. Other party confirms or WTC reviews
3. Trade Officer / Administrator verifies closing information
4. Final deal value is recorded
5. Success-fee payer is selected
6. Fee is calculated
7. Deal becomes Closed
8. Finance invoice is generated
9. Audit event is written
10. Both parties are notified

Super Administrator should be able to correct a closed deal through an audited adjustment workflow rather than silently changing historical values.

---

## 18. Recommended Marketplace Terminology

Use:

- **Deal**
- **Opportunity**
- **Investment Mandate**
- **Match**
- **Introduction**
- **Deal Room**
- **Success Fee**
- **Closed Deal**
- **Investor**
- **Business**
- **WTC Member**

Avoid reintroducing:

- Buyer as a participant tier
- Bid / bids as the primary deal terminology
- Separate paid marketplace tiers for WTC Accra and WTCA unless WTC Accra later chooses to reinstate them

---

## 19. Proposed Build Agenda

### Phase 1 — Commercial Model

- Approve three marketplace tiers
- Approve Investor US$1,500 fee
- Approve Business free access
- Approve WTC Member free access
- Approve 1% success fee for Business / WTC Member
- Confirm Investor has no success fee
- Confirm whether US$1,500 is annual or one-time
- Confirm success-fee liable-party rules

### Phase 2 — Participant Consolidation

- Reduce public participant choice to Investor / Business / WTC Member
- Retain WTC Accra / WTCA as WTC Member subtypes
- Migrate existing accounts safely
- Preserve verification and membership records

### Phase 3 — Pricing & Billing

- Replace legacy annual pricing
- Add Investor US$1,500 plan
- Make Business and WTC Member free
- Remove unnecessary payment gates
- Add success-fee ledger

### Phase 4 — Investment Mandates

- Add Investor mandate creation
- Add amount bands
- Add sectors / countries / regions
- Add mandate expiry
- Add visibility controls

### Phase 5 — Matching

- Match mandates to opportunities
- Match businesses to investors
- Match WTC members to businesses / investors
- Add match scores and reasons
- Add admin-controlled introductions

### Phase 6 — Deal Rooms

- Track deal progress
- Add milestones
- Add participant confirmation
- Add closing workflow
- Record final transaction value

### Phase 7 — Success-Fee Engine

- Determine liable participant
- Calculate 1%
- Store currency + USD equivalent
- Generate invoice
- Track settlement
- Finance approval
- Notifications

### Phase 8 — Dashboards & Reporting

- Update Investor dashboard
- Update Business dashboard
- Update WTC Member dashboard
- Update staff dashboards
- Add financial KPIs
- Add deal pipeline KPIs
- Add success-fee reports

### Phase 9 — Migration & Audit

- Map old participant types
- Migrate subscriptions
- Preserve verified accounts
- Preserve historical deals
- Preserve payment history
- Test permissions
- Audit all roles
- Production release

---

## 20. Recommended Mapping From Current Platform

| Current Participant | Proposed Marketplace Tier |
| --- | --- |
| Investor | Investor |
| Business | Business |
| WTC Accra Member | WTC Member — subtype WTC Accra |
| WTCA Member / WTC Association Member | WTC Member — subtype WTCA |
| Buyer | Migrate based on actual use; generally Business |
| Project Sponsor | Generally Business |
| Institutional Partner | Business or WTC Member depending on membership |
| Staff | Staff — not a commercial participant tier |

The migration must preserve the current account's verification and membership source.

---

## 21. Important Decisions Before Implementation

The following should be approved before production code is changed:

1. **Is the Investor US$1,500 fee annual or one-time?**
2. **Does an Investor ever pay a success fee?**  
   Current proposal: **No**.
3. **Does the 1% fee apply to every Business / WTC Member closed deal regardless of value?**  
   Current proposal: **Yes**.
4. **For Business-to-Business and WTC-to-WTC deals, who pays?**  
   Recommended: opportunity owner by default.
5. **Can Super Admin waive / reduce a success fee?**  
   Recommended: Yes, with mandatory reason and audit log.
6. **When is the fee legally considered earned?**  
   Recommended: when WTC verifies the transaction as closed.
7. **How soon after closing is the success fee due?**  
   Suggested policy: 7–30 days, to be confirmed.
8. **Should Investor mandates be public teasers or visible only to verified marketplace participants?**
9. **Should WTC Members receive any additional privileges beyond the same commercial pricing?**

---

## 22. Recommended Model For Approval

For the first implementation, the cleanest commercial model is:

### Investor

**US$1,500 access fee**  
**0% success fee**

### Business

**Free to join**  
**Free to post**  
**1% success fee on a verified closed deal**

### WTC Member

**Free to join**  
**Free to post**  
**1% success fee on a verified closed deal**

WTC Member includes:

- WTC Accra Member
- WTCA Member

Deal values are classified separately into:

- Up to US$5M
- US$5M–10M
- US$10M–50M
- US$50M+

This keeps the platform easy to explain, simple to sell, and straightforward to implement and audit.
