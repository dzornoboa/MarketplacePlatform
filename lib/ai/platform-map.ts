/* The platform, described once, for the AI helper and the super-admin agent.
   Each entry: where it is, what it does, who can see it and the words a
   member is likely to use when asking about it. */

export type PlatformPage = { href: string; title: string; audience: 'public' | 'member' | 'staff' | 'admin' | 'editor' | 'super_admin'; summary: string; keywords: string[] }

export const PLATFORM_PAGES: PlatformPage[] = [
  { href: '/', title: 'Home', audience: 'public', summary: 'Public website of WTC Accra Hub.', keywords: ['home', 'website', 'landing'] },
  { href: '/register', title: 'Create an account', audience: 'public', summary: 'Sign up as an investor, buyer, business, project sponsor, WTC member or institution.', keywords: ['register', 'sign up', 'create account', 'join'] },
  { href: '/login', title: 'Sign in', audience: 'public', summary: 'Member sign in.', keywords: ['login', 'sign in', 'log in'] },
  { href: '/forgot-password', title: 'Forgot password', audience: 'public', summary: 'Request a password reset link by email.', keywords: ['password', 'forgot', 'reset', 'locked out'] },
  { href: '/opportunities', title: 'Live listings', audience: 'public', summary: 'Public teasers of every published opportunity. Sign in with an active plan to see figures and bid.', keywords: ['listings', 'live listings', 'deals', 'opportunities', 'marketplace', 'browse'] },
  { href: '/membership', title: 'Membership and plans', audience: 'public', summary: 'Plans, prices and who each plan is for.', keywords: ['membership', 'plans', 'pricing', 'price', 'cost', 'fees'] },
  { href: '/how-it-works', title: 'How it works', audience: 'public', summary: 'Register → complete profile → upload documents → WTC Accra review → choose a plan → pay → marketplace opens.', keywords: ['how it works', 'process', 'steps', 'onboarding'] },
  { href: '/contact', title: 'Contact', audience: 'public', summary: 'Contact World Trade Centre Accra.', keywords: ['contact', 'phone', 'email', 'address', 'office'] },
  { href: '/dashboard', title: 'Overview', audience: 'member', summary: 'Your workspace: verification state, plan, quick actions.', keywords: ['dashboard', 'overview', 'workspace'] },
  { href: '/dashboard/feed', title: 'Home feed', audience: 'member', summary: 'New listings, people and activity from your network.', keywords: ['feed', 'news', 'activity', 'updates'] },
  { href: '/dashboard/network', title: 'Network', audience: 'member', summary: 'Directory of verified members: follow them or request a connection.', keywords: ['network', 'members', 'directory', 'connect', 'connection', 'follow', 'people'] },
  { href: '/dashboard/opportunities', title: 'Opportunities', audience: 'member', summary: 'Browse published listings, post your own, submit for review, withdraw or delete.', keywords: ['post', 'listing', 'opportunity', 'publish', 'submit for review', 'edit listing', 'delete listing', 'my listings'] },
  { href: '/dashboard/opportunities/new', title: 'Post an opportunity', audience: 'member', summary: 'Create a new listing (draft) then submit it for WTC Accra review.', keywords: ['post', 'new listing', 'create listing', 'sell', 'raise capital'] },
  { href: '/dashboard/matches', title: 'Matches', audience: 'member', summary: 'Listings scored automatically against your mandate or buying requirements.', keywords: ['matches', 'match', 'recommendations', 'suggested'] },
  { href: '/dashboard/saved', title: 'Saved', audience: 'member', summary: 'Your shortlist of saved listings.', keywords: ['saved', 'shortlist', 'bookmark'] },
  { href: '/dashboard/interests', title: 'Expressions of interest', audience: 'member', summary: 'Bids you placed and bids received on your listings. Bids go through WTC Accra due diligence before the owner sees them.', keywords: ['bid', 'bids', 'expression of interest', 'interest', 'offer', 'due diligence'] },
  { href: '/dashboard/introductions', title: 'Introductions', audience: 'member', summary: 'Introductions arranged by the WTC Accra trade desk.', keywords: ['introduction', 'introduce', 'intro'] },
  { href: '/dashboard/deal-rooms', title: 'Deal rooms', audience: 'member', summary: 'Private rooms for a deal in progress, with shared documents.', keywords: ['deal room', 'data room', 'negotiate'] },
  { href: '/dashboard/notifications', title: 'Notifications', audience: 'member', summary: 'Every decision, message and update sent to you.', keywords: ['notifications', 'alerts', 'messages'] },
  { href: '/dashboard/organisation', title: 'Organisation', audience: 'member', summary: 'Your company record: name, registration number, website, team.', keywords: ['organisation', 'organization', 'company', 'business details', 'registration number'] },
  { href: '/dashboard/mandate', title: 'Mandate and requirements', audience: 'member', summary: 'Investment mandate (sectors, geographies, ticket size) or buying requirements — drives automatic matches.', keywords: ['mandate', 'requirements', 'buying requirement', 'ticket', 'budget', 'sectors'] },
  { href: '/dashboard/documents', title: 'Documents', audience: 'member', summary: 'Upload identity, business certificate and listing documents.', keywords: ['documents', 'upload', 'certificate', 'id', 'passport', 'files'] },
  { href: '/dashboard/profile', title: 'Profile', audience: 'member', summary: 'Your personal details and participant type.', keywords: ['profile', 'name', 'phone', 'participant type', 'details'] },
  { href: '/dashboard/verification', title: 'Verification', audience: 'member', summary: 'Checklist to get verified: profile, organisation, documents, plan, then submit for WTC Accra review.', keywords: ['verify', 'verification', 'verified', 'approval', 'review', 'pending', 'kyc'] },
  { href: '/dashboard/billing', title: 'Billing and membership', audience: 'member', summary: 'Choose, upgrade or downgrade a plan; pay by card, mobile money or bank transfer; renew.', keywords: ['billing', 'pay', 'payment', 'subscription', 'plan', 'upgrade', 'downgrade', 'renew', 'invoice', 'mobile money', 'momo', 'card', 'bank transfer', 'expired'] },
  { href: '/dashboard/security', title: 'Security', audience: 'member', summary: 'Change password and set up two-factor authentication.', keywords: ['security', 'password', '2fa', 'mfa', 'two-factor', 'authenticator', 'code'] },
  { href: '/dashboard/settings', title: 'Settings', audience: 'member', summary: 'Email notification preferences and your access state.', keywords: ['settings', 'preferences', 'email notifications'] },
  { href: '/dashboard/support', title: 'Support', audience: 'member', summary: 'Open a support request to the WTC Accra team.', keywords: ['support', 'help', 'contact support', 'ticket', 'problem', 'issue', 'bug'] },
  { href: '/admin', title: 'Administration overview', audience: 'staff', summary: 'Queues, KPIs and activity.', keywords: ['admin', 'console', 'control centre'] },
  { href: '/admin/insights', title: 'Insights', audience: 'staff', summary: 'KPIs, charts and AI commentary on members, revenue and deal flow.', keywords: ['kpi', 'insights', 'graphs', 'charts', 'analytics', 'report', 'statistics'] },
  { href: '/admin/verification', title: 'Verification queue', audience: 'staff', summary: 'Approve, request changes or reject member applications; see their documents.', keywords: ['verification queue', 'approve member', 'applications'] },
  { href: '/admin/users', title: 'Members', audience: 'admin', summary: 'Every member; open one to edit details, verify, message, set plan, send password reset, support bypass.', keywords: ['members', 'users', 'edit user', 'suspend', 'block', 'role'] },
  { href: '/admin/opportunities', title: 'Opportunity review', audience: 'staff', summary: 'Review, publish, request changes or reject listings; set the deal rating.', keywords: ['review listing', 'publish listing', 'opportunity review', 'trade desk'] },
  { href: '/admin/bids', title: 'Bid due diligence', audience: 'staff', summary: 'Clear or reject member bids before owners see them.', keywords: ['bids queue', 'clear bid', 'due diligence'] },
  { href: '/admin/introductions', title: 'Introductions queue', audience: 'staff', summary: 'Approve, introduce, schedule meetings and complete member introduction requests.', keywords: ['introductions queue', 'arrange introduction', 'meeting'] },
  { href: '/admin/subscriptions', title: 'Subscriptions', audience: 'staff', summary: 'Approve restricted plans, activate, and see who is on what.', keywords: ['subscriptions', 'approve plan'] },
  { href: '/admin/payments', title: 'Payments', audience: 'staff', summary: 'Confirm bank and mobile-money payments by reference.', keywords: ['confirm payment', 'payments queue', 'finance'] },
  { href: '/admin/support', title: 'Support desk', audience: 'staff', summary: 'Reply to member requests.', keywords: ['support desk', 'tickets'] },
  { href: '/admin/emails', title: 'Email queue', audience: 'admin', summary: 'Outbound emails waiting to send.', keywords: ['email queue', 'smtp', 'emails'] },
  { href: '/admin/audit', title: 'Audit log', audience: 'admin', summary: 'Every administrative action with who did it.', keywords: ['audit', 'log', 'history', 'who changed'] },
  { href: '/admin/assistant', title: 'AI assistant', audience: 'super_admin', summary: 'Super-admin agent that can verify, approve, confirm payments, review bids and listings, message members and report KPIs on instruction.', keywords: ['assistant', 'agent', 'ai', 'automate'] },
  { href: '/editor', title: 'Editor console', audience: 'editor', summary: 'News, page content, website builder, site settings.', keywords: ['editor', 'content', 'news', 'website builder', 'edit website', 'settings'] },
  { href: '/editor/builder', title: 'Website builder', audience: 'editor', summary: 'Visual editor for the public website.', keywords: ['builder', 'edit page', 'elementor', 'hero', 'section'] },
]

export const PLATFORM_FACTS = `
Access model: a member must (1) complete profile and documents, (2) be verified by WTC Accra, (3) hold an active subscription plan (paid by card, mobile money or bank transfer; free "Verified Investor Basic" for investors) before they can see full listings and bid. Staff can pause browsing or posting per member.
Bids: a bid (expression of interest) goes to WTC Accra due diligence first, then to the listing owner, who accepts or declines; both sides are notified at each step.
Listings: members create a draft, submit it for review; the trade desk publishes, requests changes or rejects. Owners can withdraw (unpublish), edit and delete.
Plans: grouped by participant type. WTC member plans need an @wtcaccra.com email; institutional, government and DFI plans need a verified organisation and WTC Accra approval after payment. Expired plans pause marketplace access until renewed.
Matches: listings are scored automatically against a member's mandate or buying requirements.
Support: members open requests under Support; staff reply from the support desk. Password resets are emailed from Forgot password (or by support).
Payments in test mode are simulated; live mode uses the payment provider.
`.trim()

export function findPages(question: string, audience: string[]): PlatformPage[] {
  const q = question.toLowerCase()
  const STOP = new Set(['what', 'where', 'when', 'does', 'this', 'that', 'with', 'from', 'have', 'need', 'want', 'find', 'about', 'there', 'their', 'will', 'your', 'into', 'page', 'platform', 'them', 'they', 'some', 'more', 'like'])
  const words = q.split(/[^a-z0-9]+/).filter(w => w.length > 3 && !STOP.has(w))
  return PLATFORM_PAGES
    .filter(p => audience.includes(p.audience))
    .map(p => ({ p, score: p.keywords.reduce((s, k) => s + (q.includes(k) ? (k.includes(' ') ? 3 : 2) : 0), 0) + words.filter(w => p.title.toLowerCase().includes(w) || p.summary.toLowerCase().includes(w)).length }))
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(x => x.p)
}
