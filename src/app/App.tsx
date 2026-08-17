import React, { useState } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Globe, Shield, Lock, Zap, TrendingUp, DollarSign,
  ChevronRight, Bell, FileText, Eye, Gavel, CheckCircle2, Clock,
  ArrowUpRight, Star, MapPin, BarChart2, LogOut, Settings,
  Home, Check, Building2, ChevronDown, Award, RefreshCw,
  Layers, Wallet,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View = "landing" | "investor" | "founder";
type Currency = "USD" | "EUR" | "AED" | "JPY" | "GBP" | "SGD";
type NavItem = { id: string; label: string; icon: React.ElementType };

// ─── FX DATA ──────────────────────────────────────────────────────────────────

const CURRENCIES: Currency[] = ["USD", "EUR", "AED", "JPY", "GBP", "SGD"];
const FX: Record<Currency, number> = { USD: 1, EUR: 0.918, AED: 3.673, JPY: 149.84, GBP: 0.788, SGD: 1.341 };
const SYM: Record<Currency, string> = { USD: "$", EUR: "€", AED: "AED ", JPY: "¥", GBP: "£", SGD: "S$" };

function fmt(usd: number, ccy: Currency = "USD"): string {
  const val = usd * FX[ccy];
  const sym = SYM[ccy];
  if (val >= 1e9) return `${sym}${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${sym}${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${sym}${(val / 1e3).toFixed(0)}K`;
  return `${sym}${val.toFixed(0)}`;
}

// ─── DEAL DATA ────────────────────────────────────────────────────────────────

const DEALS = [
  {
    id: "d1", name: "Nexus AI", sector: "Technology", stage: "Series A",
    country: "UAE", city: "Dubai", founder: "Amira Khalil",
    target: 15_000_000, committed: 9_200_000, matchScore: 94,
    minTicket: 250_000, irr: "24–32%", ndaSigned: true,
    description: "AI supply chain optimization for MENA logistics. 3× YoY growth, $4.2M ARR, 180 enterprise clients.",
    wtcChapter: "WTC Dubai", initials: "NA", accentBg: "#1B3A6B",
  },
  {
    id: "d2", name: "GreenHaven Realty", sector: "Real Estate", stage: "Growth",
    country: "Singapore", city: "Singapore", founder: "Lucas Tan",
    target: 50_000_000, committed: 31_500_000, matchScore: 87,
    minTicket: 500_000, irr: "14–19%", ndaSigned: true,
    description: "Institutional-grade green commercial portfolio across Singapore and KL. LEED Platinum certified.",
    wtcChapter: "WTC Singapore", initials: "GH", accentBg: "#1F4A2C",
  },
  {
    id: "d3", name: "VoltEdge Energy", sector: "Energy", stage: "Series B",
    country: "Germany", city: "Berlin", founder: "Katrin Müller",
    target: 30_000_000, committed: 12_000_000, matchScore: 78,
    minTicket: 1_000_000, irr: "18–27%", ndaSigned: false,
    description: "Next-gen solid-state battery storage for industrial grid balancing. EU Horizon grant recipient.",
    wtcChapter: "WTC Berlin", initials: "VE", accentBg: "#4A3D18",
  },
  {
    id: "d4", name: "MediCore Systems", sector: "Healthcare", stage: "Series A",
    country: "USA", city: "Boston", founder: "Dr. Priya Nair",
    target: 12_000_000, committed: 8_800_000, matchScore: 91,
    minTicket: 100_000, irr: "28–40%", ndaSigned: true,
    description: "FDA-cleared AI pathology platform cutting false negatives by 43%. 280 hospital clients.",
    wtcChapter: "WTC Boston", initials: "MC", accentBg: "#3C1A50",
  },
  {
    id: "d5", name: "PayPath FinTech", sector: "FinTech", stage: "Seed",
    country: "UAE", city: "Abu Dhabi", founder: "Omar Al-Rashid",
    target: 5_000_000, committed: 2_100_000, matchScore: 83,
    minTicket: 50_000, irr: "—", ndaSigned: false,
    description: "B2B cross-border payment rails for GCC SMEs. 1,200 business accounts, $80M annualized volume.",
    wtcChapter: "WTC Abu Dhabi", initials: "PP", accentBg: "#1A3B4A",
  },
  {
    id: "d6", name: "UrbanFlow Mobility", sector: "Technology", stage: "Series A",
    country: "Japan", city: "Tokyo", founder: "Kenji Watanabe",
    target: 20_000_000, committed: 7_600_000, matchScore: 72,
    minTicket: 500_000, irr: "20–28%", ndaSigned: false,
    description: "Autonomous last-mile logistics for dense urban environments. Operational in 60 cities across Asia.",
    wtcChapter: "WTC Tokyo", initials: "UF", accentBg: "#2A1A4A",
  },
];

const PORTFOLIO_DATA = [
  { m: "Feb", c: 420 }, { m: "Mar", c: 820 }, { m: "Apr", c: 1100 },
  { m: "May", c: 1450 }, { m: "Jun", c: 1850 }, { m: "Jul", c: 1850 },
  { m: "Aug", c: 1850 },
];

const VDR_LOG = [
  { investor: "James Pemberton", firm: "Meridian Capital", location: "London, UK", time: "Today, 14:32", docs: ["Pitch Deck", "Financial Model"], verified: true },
  { investor: "Sun Wei", firm: "Pacific Growth Partners", location: "Hong Kong", time: "Today, 11:07", docs: ["Cap Table", "Pitch Deck"], verified: true },
  { investor: "Rania Al-Fayed", firm: "Gulf Ventures", location: "Riyadh, SA", time: "Yesterday, 16:45", docs: ["Financial Model", "Term Sheet"], verified: true },
  { investor: "Henrik Strauss", firm: "Bayern Equity", location: "Munich, DE", time: "Yesterday, 09:12", docs: ["Pitch Deck"], verified: false },
  { investor: "Aditi Chopra", firm: "IndoTech Capital", location: "Mumbai, IN", time: "3 days ago", docs: ["Business Plan", "Financial Model"], verified: true },
];

const ACTIVE_BIDS = [
  { id: "b1", investor: "Meridian Capital", amount: 1_200_000, type: "Hard Bid", status: "In Escrow", submitted: "2 days ago", equity: "18%" },
  { id: "b2", investor: "Gulf Ventures", amount: 800_000, type: "Hard Bid", status: "Under Review", submitted: "3 days ago", equity: "12%" },
  { id: "b3", investor: "Pacific Growth Partners", amount: 500_000, type: "Soft Commit", status: "Pending NDA", submitted: "4 days ago", equity: "TBD" },
  { id: "b4", investor: "IndoTech Capital", amount: 250_000, type: "Soft Commit", status: "Interested", submitted: "5 days ago", equity: "TBD" },
];

const WORKFLOW_STEPS = [
  { n: 1, Icon: Shield, title: "Register & Verify", desc: "KYC/AML via Persona or Sumsub. Identity and investor accreditation confirmed." },
  { n: 2, Icon: Globe, title: "Profile Setup", desc: "Set native currency, language preference, sector mandates, and wallet link." },
  { n: 3, Icon: Layers, title: "List or Subscribe", desc: "Founders select a SaaS tier. Investors complete preference profiling." },
  { n: 4, Icon: Zap, title: "AI Matchmaking", desc: "Python vector engine scores 40+ attributes to surface highest-confidence deals." },
  { n: 5, Icon: Lock, title: "NDA → VDR Access", desc: "Sign dynamic NDA. Unlock documents watermarked with your identity and IP." },
  { n: 6, Icon: Gavel, title: "Bid or Soft Commit", desc: "Term-sheet bids backed by third-party escrow. Zero platform custody." },
  { n: 7, Icon: CheckCircle2, title: "Escrow & Close", desc: "Milestone-based disbursements. Electronic contract execution on success." },
  { n: 8, Icon: Star, title: "Reputation & Review", desc: "KYC-verified ratings update public trust scores for founders and investors." },
];

const FEATURES = [
  { Icon: Lock, title: "Virtual Data Room", desc: "Dynamic watermarking stamps every document with the downloader's identity, IP address, and timestamp. Full access audit trail maintained." },
  { Icon: Zap, title: "AI Match Engine", desc: "Python cosine-similarity engine matches across check size, sector, stage, and geographic mandate to surface high-confidence opportunities first." },
  { Icon: Shield, title: "Escrow-Linked Bids", desc: "Zero platform custody. All capital holds and milestone releases are fully delegated to licensed third-party escrow providers." },
  { Icon: DollarSign, title: "Multi-Currency FX", desc: "60-second Redis-cached live rates enable real-time recalculation across USD, EUR, AED, JPY, GBP, SGD, and 20+ additional currencies." },
  { Icon: CheckCircle2, title: "KYC/AML Compliance", desc: "Integrated Persona/Sumsub identity verification, investor accreditation audits, and mandatory WTC chapter membership validation." },
  { Icon: Star, title: "Reputation Ledger", desc: "KYC-backed peer reviews score founder transparency and investor reliability. Non-editable, append-only trust history on every profile." },
];

const PRICING = [
  {
    tier: "Starter", price: 299,
    tagline: "For early-stage founders testing the market",
    features: ["1 active project listing", "Standard VDR with watermarking", "Up to 20 investor NDA requests", "Basic AI matching exposure", "Email support"],
    cta: "Start Free Trial", accent: false,
  },
  {
    tier: "Professional", price: 799,
    tagline: "For founders actively running a live round",
    features: ["3 active project listings", "Advanced VDR with full audit logs", "Unlimited NDA requests", "Priority AI matching placement", "Syndicate pool access", "Dedicated chapter liaison"],
    cta: "Get Started", accent: true,
  },
  {
    tier: "Enterprise", price: 2499,
    tagline: "For multi-project or chapter-level programs",
    features: ["Unlimited active projects", "White-glove onboarding", "Custom NDA templates", "Exclusive chapter matching", "Term sheet review support", "Co-investment facilitation", "24/7 priority support"],
    cta: "Contact Sales", accent: false,
  },
];

// ─── SHARED MICRO-COMPONENTS ──────────────────────────────────────────────────

function MatchPill({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-400" : score >= 80 ? "text-amber-400" : "text-muted-foreground";
  return (
    <span className={`flex items-center gap-1 text-xs font-mono ${color}`}>
      <Zap className="w-3 h-3" />{score}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "In Escrow": "bg-emerald-900/30 text-emerald-400 border-emerald-800/40",
    "Under Review": "bg-amber-900/30 text-amber-400 border-amber-800/40",
    "Pending NDA": "bg-blue-900/30 text-blue-400 border-blue-800/40",
    "Interested": "border-border text-muted-foreground",
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${map[status] ?? "border-border text-muted-foreground"}`}>
      {status}
    </span>
  );
}

// ─── CURRENCY SWITCHER ────────────────────────────────────────────────────────

function CurrencySwitcher({ currency, setCurrency }: { currency: Currency; setCurrency: (c: Currency) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-mono border border-border px-3 py-1.5 rounded hover:border-primary/40 transition-colors"
      >
        <span className="text-primary">{currency}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded shadow-xl z-50 py-1 min-w-[100px]">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCurrency(c); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-accent transition-colors ${c === currency ? "text-primary" : "text-muted-foreground"}`}
            >
              {c} {SYM[c].trim()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function Sidebar({ items, active, setActive, onBack }: {
  items: NavItem[]; active: string; setActive: (id: string) => void; onBack: () => void;
}) {
  return (
    <aside className="w-52 flex-shrink-0 border-r border-border bg-card/40 flex flex-col">
      <div className="h-14 border-b border-border px-4 flex items-center gap-2 flex-shrink-0">
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">WTC Investors</span>
      </div>
      <nav className="flex-1 p-2.5 space-y-px">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-all text-left ${
              active === id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-2.5 border-t border-border space-y-px">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
          <Settings className="w-4 h-4" />Settings
        </button>
        <button
          onClick={onBack}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
        >
          <LogOut className="w-4 h-4" />Back to Platform
        </button>
      </div>
    </aside>
  );
}

// ─── DASHBOARD TOP BAR ────────────────────────────────────────────────────────

function DashTopBar({ title, currency, setCurrency, initials, name }: {
  title: string; currency: Currency; setCurrency: (c: Currency) => void; initials: string; name: string;
}) {
  return (
    <div className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/30 flex-shrink-0">
      <span className="text-sm font-medium text-foreground">{title}</span>
      <div className="flex items-center gap-3">
        <CurrencySwitcher currency={currency} setCurrency={setCurrency} />
        <button className="relative w-8 h-8 flex items-center justify-center border border-border rounded hover:border-primary/30 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 rounded bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-mono text-primary">
          {initials}
        </div>
        <span className="hidden md:block text-sm text-muted-foreground">{name}</span>
      </div>
    </div>
  );
}

// ─── LANDING: NAVBAR ─────────────────────────────────────────────────────────

function NavBar({ setView }: { setView: (v: View) => void }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView("landing")} className="flex items-center gap-2.5 group">
          <Globe className="w-5 h-5 text-primary" />
          <span className="text-xs font-mono uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
            WTC Investors
          </span>
        </button>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {["Platform", "Deals", "Chapters", "About"].map((l) => (
            <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("investor")}
            className="hidden md:block text-sm text-muted-foreground border border-border px-4 py-1.5 rounded hover:border-primary/30 hover:text-foreground transition-all"
          >
            Investor Login
          </button>
          <button
            onClick={() => setView("founder")}
            className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded hover:opacity-90 transition-opacity font-medium"
          >
            List a Project
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── LANDING: HERO ────────────────────────────────────────────────────────────

function HeroSection({ setView }: { setView: (v: View) => void }) {
  return (
    <section className="pt-36 pb-24 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(200,169,110,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative text-center">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-primary border border-primary/25 bg-primary/5 px-4 py-1.5 rounded-full mb-12">
          <Award className="w-3 h-3" />
          Official WTCA Digital Capital Platform · 94 Chapters · 47 Countries
        </div>
        <h1
          className="mb-6 text-foreground"
          style={{ fontFamily: '"DM Serif Display", serif', fontSize: "clamp(3rem, 7vw, 5.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
        >
          Where Capital Meets<br />
          <em style={{ color: "var(--primary)", fontStyle: "italic" }}>Global Opportunity</em>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
          The verified private capital marketplace for accredited investors and audited founders —
          across 94 World Trade Center chapters worldwide.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          {[
            { Icon: Building2, title: "I'm a Founder", sub: "List your project, manage a VDR, attract global capital", view: "founder" as View },
            { Icon: TrendingUp, title: "I'm an Investor", sub: "Discover AI-matched deals, review VDRs, place bids", view: "investor" as View },
          ].map(({ Icon, title, sub, view }) => (
            <button
              key={view}
              onClick={() => setView(view)}
              className="group flex flex-col items-start p-5 border border-border hover:border-primary/40 rounded bg-card transition-all text-left"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <Icon className="w-5 h-5 text-primary" />
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="text-sm font-medium text-foreground mb-1">{title}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LANDING: STATS BAR ───────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { v: "$2.4B", l: "Capital Deployed" },
    { v: "847", l: "Verified Projects" },
    { v: "12,400+", l: "Accredited Investors" },
    { v: "94", l: "WTC Chapters" },
    { v: "47", l: "Countries" },
  ];
  return (
    <div className="border-y border-border bg-card/40">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
        {stats.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-mono font-medium text-primary mb-1">{s.v}</div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LANDING: DEALS ───────────────────────────────────────────────────────────

function DealsSection({ currency }: { currency: Currency }) {
  const [sector, setSector] = useState("All");
  const sectors = ["All", "Technology", "Real Estate", "Energy", "Healthcare", "FinTech"];
  const filtered = sector === "All" ? DEALS : DEALS.filter((d) => d.sector === sector);

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Live Deals</div>
            <h2 className="text-foreground" style={{ fontFamily: '"DM Serif Display", serif', fontSize: "2.25rem", lineHeight: 1.15 }}>
              Featured Opportunities
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-all ${
                  sector === s ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d) => {
            const pct = Math.round((d.committed / d.target) * 100);
            return (
              <div key={d.id} className="border border-border hover:border-primary/25 rounded bg-card transition-all overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded flex items-center justify-center text-xs font-mono font-medium text-foreground flex-shrink-0" style={{ backgroundColor: d.accentBg }}>
                        {d.initials}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{d.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{d.city} · {d.wtcChapter}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-0.5 rounded">{d.sector}</span>
                      <span className="text-xs font-mono text-muted-foreground">{d.stage}</span>
                    </div>
                  </div>
                </div>
                <div className="px-5 pt-4 pb-3 flex-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.description}</p>
                </div>
                <div className="px-5 py-3 grid grid-cols-3 gap-3 border-t border-border bg-background/20 text-xs">
                  {[["Target", fmt(d.target, currency)], ["Min Ticket", fmt(d.minTicket, currency)], ["IRR", d.irr]].map(([l, v]) => (
                    <div key={l}>
                      <div className="font-mono text-muted-foreground mb-0.5">{l}</div>
                      <div className="font-mono text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground"><span className="font-mono text-foreground">{fmt(d.committed, currency)}</span> committed</span>
                    <span className="font-mono text-primary">{pct}%</span>
                  </div>
                  <div className="h-1 bg-secondary rounded-full">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                  <MatchPill score={d.matchScore} />
                  <button className={`text-xs px-3 py-1.5 rounded border transition-all ${
                    d.ndaSigned ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20" : "border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  }`}>
                    {d.ndaSigned ? "View VDR" : "Sign NDA"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── LANDING: WORKFLOW ────────────────────────────────────────────────────────

function WorkflowSection() {
  return (
    <section className="py-20 px-6 border-y border-border bg-card/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">How It Works</div>
          <h2 className="text-foreground" style={{ fontFamily: '"DM Serif Display", serif', fontSize: "2.25rem", lineHeight: 1.15 }}>
            The Full Investment Lifecycle
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOW_STEPS.map(({ n, Icon, title, desc }) => (
            <div key={n} className="p-5 border border-border rounded bg-card hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded border border-border flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">Step {String(n).padStart(2, "0")}</span>
              </div>
              <div className="text-sm font-medium text-foreground mb-2">{title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LANDING: FEATURES ────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Platform Capabilities</div>
          <h2 className="text-foreground" style={{ fontFamily: '"DM Serif Display", serif', fontSize: "2.25rem", lineHeight: 1.15 }}>
            Built for Institutional-Grade Deals
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="p-6 border border-border rounded bg-card hover:border-primary/20 transition-colors group">
              <div className="w-10 h-10 rounded border border-primary/20 flex items-center justify-center mb-5 group-hover:border-primary/50 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="font-medium text-foreground mb-2 text-sm">{title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LANDING: PRICING ─────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section className="py-20 px-6 border-t border-border bg-card/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Founder Plans</div>
          <h2 className="text-foreground" style={{ fontFamily: '"DM Serif Display", serif', fontSize: "2.25rem", lineHeight: 1.15 }}>
            Choose Your Raise Plan
          </h2>
          <p className="text-xs text-muted-foreground mt-3">Investors access the platform at no cost, subject to KYC verification.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PRICING.map((p) => (
            <div key={p.tier} className={`p-6 rounded border relative transition-all ${p.accent ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
              {p.accent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono text-primary-foreground bg-primary px-3 py-0.5 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-2">{p.tier}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-mono font-medium text-foreground">${p.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">{p.tagline}</div>
              </div>
              <ul className="space-y-2.5 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded text-sm font-medium transition-all ${
                p.accent ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:border-primary/40"
              }`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── LANDING: FOOTER ──────────────────────────────────────────────────────────

function FooterSection({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="border-t border-border">
      <div className="bg-card/30 border-b border-border py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-foreground mb-4" style={{ fontFamily: '"DM Serif Display", serif', fontSize: "2rem", lineHeight: 1.2 }}>
            Ready to participate in global private markets?
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Join 12,400+ accredited investors and 847 verified founders on the only platform built around the World Trade Center global network.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => setView("founder")} className="px-6 py-2.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity">
              List Your Project
            </button>
            <button onClick={() => setView("investor")} className="px-6 py-2.5 border border-border text-foreground rounded text-sm font-medium hover:border-primary/40 transition-colors">
              Explore as Investor
            </button>
          </div>
        </div>
      </div>
      <div className="py-8 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Globe className="w-4 h-4 text-primary" />
          WTC Investors Hub · Official WTCA Digital Platform · © 2025
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          {["Privacy", "Terms", "Compliance", "Contact"].map((l) => (
            <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── INVESTOR DASHBOARD ───────────────────────────────────────────────────────

function InvestorDashboard({ setView }: { setView: (v: View) => void }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [tab, setTab] = useState("deals");

  const navItems: NavItem[] = [
    { id: "deals", label: "Deal Flow", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: BarChart2 },
    { id: "bids", label: "My Bids", icon: Gavel },
    { id: "vdr", label: "VDR Access", icon: Lock },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "kyc", label: "Profile & KYC", icon: Shield },
  ];

  const kpis = [
    { l: "AI-Matched Deals", v: "23", d: "+4 this week", Icon: Zap, up: true },
    { l: "Committed Capital", v: fmt(1_850_000, currency), d: "Across 7 deals", Icon: DollarSign, up: true },
    { l: "Est. Returns (12m)", v: fmt(420_000, currency), d: "+22.7% blended IRR", Icon: TrendingUp, up: true },
    { l: "Trust Score", v: "9.4 / 10", d: "8 KYC-verified reviews", Icon: Star, up: true },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar items={navItems} active={tab} setActive={setTab} onBack={() => setView("landing")} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopBar title="Investor Workspace" currency={currency} setCurrency={setCurrency} initials="JP" name="James Pemberton" />
        <main className="flex-1 overflow-y-auto p-6">

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map(({ l, v, d, Icon, up }) => (
              <div key={l} className="bg-card border border-border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider leading-snug">{l}</span>
                  <Icon className="w-4 h-4 text-primary/50 flex-shrink-0" />
                </div>
                <div className="text-xl font-mono font-medium text-foreground mb-1">{v}</div>
                <div className={`text-xs font-mono flex items-center gap-1 ${up ? "text-emerald-400" : "text-red-400"}`}>
                  <ArrowUpRight className="w-3 h-3" />{d}
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Deal feed */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-foreground">AI-Matched Opportunities</div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-primary">
                  <RefreshCw className="w-3 h-3" />Updated 6m ago
                </div>
              </div>
              {DEALS.slice(0, 5).map((d) => {
                const pct = Math.round((d.committed / d.target) * 100);
                return (
                  <div key={d.id} className="bg-card border border-border rounded p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded flex items-center justify-center text-xs font-mono font-medium text-foreground flex-shrink-0" style={{ backgroundColor: d.accentBg }}>
                        {d.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium text-foreground truncate">{d.name}</span>
                          <MatchPill score={d.matchScore} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{d.sector}</span><span>·</span><span>{d.stage}</span><span>·</span><span>{d.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-0.5 bg-secondary rounded-full">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{fmt(d.target, currency)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0 ml-2">
                        <button className="text-xs border border-primary/30 text-primary px-2.5 py-1 rounded hover:bg-primary/10 transition-colors">
                          {d.ndaSigned ? "VDR" : "NDA"}
                        </button>
                        <button className="text-xs border border-border text-muted-foreground px-2.5 py-1 rounded hover:text-foreground transition-colors">
                          Bid
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Portfolio chart */}
              <div className="bg-card border border-border rounded p-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Portfolio Commitment</div>
                <div className="text-xl font-mono font-medium text-foreground mb-4">{fmt(1_850_000, currency)}</div>
                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={PORTFOLIO_DATA}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C8A96E" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#C8A96E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#8B9CB8", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0D1427", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "4px", fontSize: "11px", fontFamily: "JetBrains Mono" }}
                      labelStyle={{ color: "#8B9CB8" }}
                      itemStyle={{ color: "#C8A96E" }}
                      formatter={(v: number) => [fmt(v * 1000, currency), "Committed"]}
                    />
                    <Area type="monotone" dataKey="c" stroke="#C8A96E" strokeWidth={1.5} fill="url(#goldGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* KYC / Accreditation */}
              <div className="bg-card border border-border rounded p-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Verification Status</div>
                {[
                  { l: "Identity KYC", ok: true },
                  { l: "Accreditation", ok: true },
                  { l: "AML Screening", ok: true },
                  { l: "WTC Membership", ok: true },
                  { l: "Wallet Linked", ok: false },
                ].map(({ l, ok }) => (
                  <div key={l} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground">{l}</span>
                    {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="bg-card border border-border rounded p-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Recent Activity</div>
                {[
                  { e: "NDA Signed", d: "VoltEdge Energy", t: "2h ago" },
                  { e: "Bid Submitted", d: "Nexus AI", t: "Yesterday" },
                  { e: "VDR Accessed", d: "MediCore Systems", t: "2 days ago" },
                  { e: "AI Matched", d: "PayPath FinTech", t: "3 days ago" },
                ].map((a) => (
                  <div key={a.d} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                    <div>
                      <span className="text-foreground">{a.e}</span>
                      <span className="text-muted-foreground ml-1.5">{a.d}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">{a.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── FOUNDER DASHBOARD ────────────────────────────────────────────────────────

function FounderDashboard({ setView }: { setView: (v: View) => void }) {
  const [currency, setCurrency] = useState<Currency>("AED");
  const [tab, setTab] = useState("overview");

  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "vdr", label: "VDR Manager", icon: Lock },
    { id: "bids", label: "Bid Pipeline", icon: Gavel },
    { id: "nda", label: "NDA Manager", icon: FileText },
    { id: "escrow", label: "Escrow", icon: Shield },
    { id: "analytics", label: "Analytics", icon: BarChart2 },
  ];

  const project = DEALS[0];
  const fundingPct = Math.round((project.committed / project.target) * 100);

  const kpis = [
    { l: "Investor Views", v: "184", d: "+12 this week", Icon: Eye },
    { l: "NDAs Signed", v: "23", d: "3 new today", Icon: FileText },
    { l: "Active Bids", v: "4", d: fmt(2_750_000, currency) + " total", Icon: Gavel },
    { l: "Committed", v: fmt(project.committed, currency), d: `${fundingPct}% of target`, Icon: DollarSign },
  ];

  const milestones = [
    { label: "WTC Chapter Verified", done: true },
    { label: "Subscription Activated", done: true },
    { label: "VDR Published", done: true },
    { label: "First Investor NDA", done: true },
    { label: "Term Sheets Received", done: true },
    { label: "Escrow Holds Active", done: true },
    { label: "Round Closed", done: false },
    { label: "Funds Disbursed", done: false },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar items={navItems} active={tab} setActive={setTab} onBack={() => setView("landing")} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopBar title="Founder Portal" currency={currency} setCurrency={setCurrency} initials="AK" name="Amira Khalil" />
        <main className="flex-1 overflow-y-auto p-6">

          {/* Project header card */}
          <div className="bg-card border border-border rounded p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded flex items-center justify-center text-sm font-mono font-medium text-foreground flex-shrink-0" style={{ backgroundColor: project.accentBg }}>
                  {project.initials}
                </div>
                <div>
                  <div className="font-medium text-foreground">{project.name}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{project.stage} · {project.sector} · {project.wtcChapter}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono text-emerald-400 border border-emerald-800/40 bg-emerald-900/20 px-2 py-0.5 rounded">Active Listing</span>
                    <span className="text-xs font-mono text-primary border border-primary/25 bg-primary/5 px-2 py-0.5 rounded">VDR Live</span>
                    <span className="text-xs font-mono text-blue-400 border border-blue-800/40 bg-blue-900/20 px-2 py-0.5 rounded">Professional Plan</span>
                  </div>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-xs font-mono text-muted-foreground mb-1">Funding Progress</div>
                <div className="text-2xl font-mono font-medium text-foreground">{fmt(project.committed, currency)}</div>
                <div className="text-xs text-muted-foreground">of {fmt(project.target, currency)} target</div>
                <div className="w-36 h-1 bg-secondary rounded-full mt-2 sm:ml-auto">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${fundingPct}%` }} />
                </div>
                <div className="text-xs font-mono text-primary mt-1">{fundingPct}% raised</div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map(({ l, v, d, Icon }) => (
              <div key={l} className="bg-card border border-border rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider leading-snug">{l}</span>
                  <Icon className="w-4 h-4 text-primary/50 flex-shrink-0" />
                </div>
                <div className="text-xl font-mono font-medium text-foreground mb-1">{v}</div>
                <div className="text-xs font-mono text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>

          {/* Three-column bottom */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* VDR Access Log */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-foreground">VDR Access Log</div>
                <span className="text-xs font-mono text-muted-foreground">Watermarked · Identity-tracked</span>
              </div>
              <div className="bg-card border border-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background/30">
                      {["Investor / Firm", "Documents", "Time"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {VDR_LOG.map((row) => (
                      <tr key={row.investor} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {row.verified
                              ? <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              : <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            <div>
                              <div className="text-foreground">{row.investor}</div>
                              <div className="text-muted-foreground">{row.firm}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.docs.map((doc) => (
                              <span key={doc} className="text-xs border border-border text-muted-foreground px-1.5 py-0.5 rounded">{doc}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Bids + Milestones */}
            <div className="lg:col-span-2 space-y-4">
              {/* Active bids */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-foreground">Bid Pipeline</div>
                  <span className="text-xs font-mono text-primary">{fmt(2_750_000, currency)}</span>
                </div>
                <div className="space-y-2.5">
                  {ACTIVE_BIDS.map((bid) => (
                    <div key={bid.id} className="bg-card border border-border rounded p-3 hover:border-primary/20 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-medium text-foreground">{bid.investor}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{bid.type} · {bid.equity} · {bid.submitted}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-mono font-medium text-foreground mb-1">{fmt(bid.amount, currency)}</div>
                          <StatusBadge status={bid.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone tracker */}
              <div className="bg-card border border-border rounded p-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Deal Milestones</div>
                <div className="space-y-2">
                  {milestones.map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-3 text-xs">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-900/40 border border-emerald-700" : "border border-border"}`}>
                        {done && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                      </div>
                      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function LandingPage({ setView }: { setView: (v: View) => void }) {
  return (
    <div>
      <NavBar setView={setView} />
      <div className="pt-16">
        <HeroSection setView={setView} />
        <StatsBar />
        <DealsSection currency="USD" />
        <WorkflowSection />
        <FeaturesSection />
        <PricingSection />
        <FooterSection setView={setView} />
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("landing");
  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "landing" && <LandingPage setView={setView} />}
      {view === "investor" && <InvestorDashboard setView={setView} />}
      {view === "founder" && <FounderDashboard setView={setView} />}
    </div>
  );
}
