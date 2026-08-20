import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  Globe, Shield, Lock, Zap, TrendingUp, DollarSign, ChevronRight, Bell,
  FileText, Eye, Gavel, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  Star, MapPin, BarChart2, LogOut, Settings, Home, Check, Building2,
  ChevronDown, Award, RefreshCw, Layers, Wallet, Search, Mail, Phone,
  User, Key, AlertCircle, Download, Upload, Plus, X, CreditCard, Activity,
  Users, BookOpen, ChevronLeft, Menu, ToggleLeft, ToggleRight, Edit2,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type View =
  | "home" | "platform" | "deals" | "chapters" | "about"
  | "login" | "register" | "list-project" | "project-detail"
  | "investor" | "founder";

type Currency = "USD" | "EUR" | "AED" | "JPY" | "GBP" | "SGD";

// ─── BRAND ────────────────────────────────────────────────────────────────────

const B = {
  navy:   "#154074",
  orange: "#E4580A",
  blue:   "#4D8BBE",
  peach:  "#F9A25E",
  teal:   "#09D0AC",
  yellow: "#E5C056",
  lgray:  "#ECECEF",
  mgray:  "#A9A9AB",
};

// ─── FX ───────────────────────────────────────────────────────────────────────

const CURRENCIES: Currency[] = ["USD", "EUR", "AED", "JPY", "GBP", "SGD"];
const FX: Record<Currency, number> = { USD: 1, EUR: 0.918, AED: 3.673, JPY: 149.84, GBP: 0.788, SGD: 1.341 };
const SYM: Record<Currency, string> = { USD: "$", EUR: "€", AED: "AED ", JPY: "¥", GBP: "£", SGD: "S$" };

function fmt(usd: number, ccy: Currency = "USD"): string {
  const v = usd * FX[ccy], s = SYM[ccy];
  if (v >= 1e9) return `${s}${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${s}${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${s}${(v / 1e3).toFixed(0)}K`;
  return `${s}${v.toFixed(0)}`;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const DEALS = [
  {
    id: "d1", name: "NovaPay Solutions", sector: "FinTech", stage: "Series A",
    country: "Kenya", city: "Nairobi", founder: "Amara Otieno", founderTitle: "CEO & Co-founder",
    founded: 2021, employees: 48,
    target: 5_000_000, committed: 3_100_000, matchScore: 84,
    minTicket: 250_000, irr: "24–32%", ndaSigned: true,
    description: "Pan-African mobile payments infrastructure processing 1.2 million monthly transactions.",
    longDesc: "NovaPay provides interoperable payment rails for merchants and financial institutions across African markets, with API based collections, settlement and reconciliation built for fragmented payment environments.",
    wtcChapter: "East Africa", initials: "NP", bg: B.navy,
    team: [{ n: "Amara Otieno", r: "CEO & Co-founder" }, { n: "David Kamau", r: "Chief Technology Officer" }, { n: "Lindiwe Mensah", r: "Chief Risk Officer" }],
    financials: { revenue: 2_600_000, growth: "186%", margin: "61%", burnRate: 190_000 },
    milestones: ["1.2M monthly transactions", "Three regulated market integrations", "Enterprise API launched", "Series A data room opened"],
    useOfFunds: [["Market expansion", "35%"], ["Product and security", "30%"], ["Regulatory licensing", "20%"], ["Working capital", "15%"]],
  },
  {
    id: "d2", name: "GreenHarvest AgriTech", sector: "AgriTech", stage: "Seed",
    country: "Nigeria", city: "Lagos", founder: "Chidi Adebayo", founderTitle: "Founder & CEO",
    founded: 2018, employees: 124,
    target: 1_500_000, committed: 620_000, matchScore: 71,
    minTicket: 500_000, irr: "14–19%", ndaSigned: true,
    description: "A digital marketplace linking smallholder farmers directly to urban retailers and processors.",
    longDesc: "GreenHarvest connects verified farmer groups with urban retailers and food processors, improving price discovery, aggregating demand and coordinating reliable last mile collection.",
    wtcChapter: "West Africa", initials: "GH", bg: B.teal,
    team: [{ n: "Chidi Adebayo", r: "Founder & CEO" }, { n: "Amina Bello", r: "Head of Supply" }, { n: "Tunde Okafor", r: "Chief Product Officer" }],
    financials: { revenue: 740_000, growth: "142%", margin: "38%", burnRate: 64_000 },
    milestones: ["4,800 farmers onboarded", "320 retail buyers active", "Two aggregation hubs launched", "Seed round opened"],
    useOfFunds: [["Aggregation hubs", "40%"], ["Product", "25%"], ["Farmer acquisition", "20%"], ["Working capital", "15%"]],
  },
  {
    id: "d3", name: "MediTrust Health", sector: "Healthcare", stage: "Series B",
    country: "Egypt", city: "Cairo", founder: "Dr. Mariam Hassan", founderTitle: "CEO",
    founded: 2019, employees: 87,
    target: 12_000_000, committed: 7_400_000, matchScore: 91,
    minTicket: 1_000_000, irr: "18–27%", ndaSigned: false,
    description: "A vertically integrated outpatient care platform serving patients across four major cities.",
    longDesc: "MediTrust operates technology enabled outpatient clinics with shared diagnostics, central procurement and a unified patient record, improving care consistency across four cities.",
    wtcChapter: "North Africa", initials: "MH", bg: B.orange,
    team: [{ n: "Dr. Mariam Hassan", r: "Chief Executive Officer" }, { n: "Omar El Sayed", r: "Chief Operating Officer" }, { n: "Dr. Salma Nabil", r: "Medical Director" }],
    financials: { revenue: 9_400_000, growth: "78%", margin: "54%", burnRate: 330_000 },
    milestones: ["18 clinics operational", "Unified patient record deployed", "Four city network completed", "Series B diligence launched"],
    useOfFunds: [["Clinic expansion", "45%"], ["Diagnostics", "25%"], ["Technology", "20%"], ["Working capital", "10%"]],
  },
  {
    id: "d4", name: "MediCore Systems", sector: "Healthcare", stage: "Series A",
    country: "USA", city: "Boston", founder: "Dr. Priya Nair", founderTitle: "CEO & Founder",
    founded: 2020, employees: 63,
    target: 12_000_000, committed: 8_800_000, matchScore: 91,
    minTicket: 100_000, irr: "28–40%", ndaSigned: true,
    description: "FDA-cleared AI pathology diagnostics reducing false negatives by 43%. 280 hospital clients in North America.",
    longDesc: "MediCore's AI platform augments pathologist workflow for cancer detection. FDA 510(k) cleared and CE marked, operating across 280 hospital systems in the US and Canada.",
    wtcChapter: "WTC Boston", initials: "MC", bg: "#6B21A8",
    team: [{ n: "Dr. Priya Nair", r: "CEO & Founder" }, { n: "James O'Connor", r: "CTO" }, { n: "Sandra Hoffmann", r: "VP Clinical" }],
    financials: { revenue: 6_800_000, growth: "240%", margin: "71%", burnRate: 320_000 },
    milestones: ["FDA 510(k) cleared 2022", "CE Mark 2023", "280 hospital integrations", "Series A 2024"],
    useOfFunds: [["Clinical Trials", "35%"], ["Sales", "35%"], ["Product Dev", "20%"], ["G&A", "10%"]],
  },
  {
    id: "d5", name: "PayPath FinTech", sector: "FinTech", stage: "Seed",
    country: "UAE", city: "Abu Dhabi", founder: "Omar Al-Rashid", founderTitle: "Co-founder & CEO",
    founded: 2022, employees: 24,
    target: 5_000_000, committed: 2_100_000, matchScore: 83,
    minTicket: 50_000, irr: "—", ndaSigned: false,
    description: "B2B cross-border payment rails for GCC SMEs. 1,200 business accounts, $80M annualized volume.",
    longDesc: "PayPath provides compliant, fast, and affordable cross-border payment infrastructure tailored to GCC regulatory requirements.",
    wtcChapter: "WTC Abu Dhabi", initials: "PP", bg: B.teal,
    team: [{ n: "Omar Al-Rashid", r: "Co-founder & CEO" }, { n: "Fatima Jaber", r: "Co-founder & CTO" }, { n: "Michael Torres", r: "Head of Compliance" }],
    financials: { revenue: 960_000, growth: "410%", margin: "42%", burnRate: 180_000 },
    milestones: ["CBUAE RegLab cohort 2023", "1,000 business clients 2023", "$80M annualized vol", "Seed round 2024"],
    useOfFunds: [["Licensing & Compliance", "40%"], ["Tech Infrastructure", "35%"], ["Team Growth", "25%"]],
  },
  {
    id: "d6", name: "UrbanFlow Mobility", sector: "Technology", stage: "Series A",
    country: "Japan", city: "Tokyo", founder: "Kenji Watanabe", founderTitle: "Founder & CEO",
    founded: 2020, employees: 95,
    target: 20_000_000, committed: 7_600_000, matchScore: 72,
    minTicket: 500_000, irr: "20–28%", ndaSigned: false,
    description: "Autonomous last-mile logistics for dense urban environments. Operating in 60 cities across Asia.",
    longDesc: "UrbanFlow has deployed a mixed fleet of autonomous delivery robots and smart e-cargo bikes managed by a centralized AI dispatch system optimized for dense Asian urban environments.",
    wtcChapter: "WTC Tokyo", initials: "UF", bg: "#7C3AED",
    team: [{ n: "Kenji Watanabe", r: "Founder & CEO" }, { n: "Yuki Tanaka", r: "CTO" }, { n: "Christine Park", r: "CFO" }],
    financials: { revenue: 5_100_000, growth: "195%", margin: "58%", burnRate: 620_000 },
    milestones: ["First city pilot Osaka 2021", "30 city expansion 2022", "60 city network 2023", "Series A 2024"],
    useOfFunds: [["Fleet Expansion", "45%"], ["Platform R&D", "30%"], ["International", "25%"]],
  },
];

type Deal = typeof DEALS[0];

const PORTFOLIO_DATA = [
  { m: "Mar", c: 420 }, { m: "Apr", c: 820 }, { m: "May", c: 1100 },
  { m: "Jun", c: 1450 }, { m: "Jul", c: 1850 }, { m: "Aug", c: 2180 },
];

const MY_INVESTMENTS = [
  { deal: "Nexus AI", sector: "Technology", invested: 500_000, currentVal: 680_000, irr: 28.4, status: "Active", date: "Jan 2024" },
  { deal: "MediCore Systems", sector: "Healthcare", invested: 250_000, currentVal: 310_000, irr: 31.2, status: "Active", date: "Mar 2024" },
  { deal: "GreenHaven Realty", sector: "Real Estate", invested: 750_000, currentVal: 840_000, irr: 15.8, status: "Active", date: "Dec 2023" },
  { deal: "TechBridge (Exited)", sector: "Technology", invested: 200_000, currentVal: 380_000, irr: 42.1, status: "Exited", date: "Jul 2022" },
  { deal: "CarbonZero Fund I", sector: "Energy", invested: 150_000, currentVal: 170_000, irr: 12.3, status: "Active", date: "Jun 2023" },
];

const VDR_ROOMS = [
  { deal: "Nexus AI", docs: ["Executive Summary", "Financial Model FY24", "Cap Table", "Pitch Deck v4", "Term Sheet Template"], lastAccess: "Today, 14:32", ndaDate: "Jan 15, 2024", watermarkId: "WTC-JP-8841" },
  { deal: "MediCore Systems", docs: ["FDA 510(k) Clearance", "Clinical Trials Data", "Revenue Model", "Pitch Deck v3"], lastAccess: "Yesterday, 11:07", ndaDate: "Mar 2, 2024", watermarkId: "WTC-JP-8841" },
  { deal: "GreenHaven Realty", docs: ["Asset Portfolio Report", "LEED Certificates", "Valuation Report Q1 24", "Investor FAQ"], lastAccess: "3 days ago", ndaDate: "Dec 20, 2023", watermarkId: "WTC-JP-8841" },
];

const MY_BIDS = [
  { id: "b1", deal: "Nexus AI", amount: 500_000, type: "Hard Bid", status: "In Escrow", submitted: "Feb 28, 2024", equity: "3.2%", escrow: "ESC-2024-0041" },
  { id: "b2", deal: "MediCore Systems", amount: 250_000, type: "Hard Bid", status: "Countered", submitted: "Mar 18, 2024", equity: "2.0%", escrow: "ESC-2024-0078" },
  { id: "b3", deal: "VoltEdge Energy", amount: 1_000_000, type: "Soft Commit", status: "NDA Pending", submitted: "Apr 2, 2024", equity: "—", escrow: "—" },
  { id: "b4", deal: "PayPath FinTech", amount: 100_000, type: "Soft Commit", status: "Interested", submitted: "Apr 10, 2024", equity: "—", escrow: "—" },
  { id: "b5", deal: "TechBridge Ltd", amount: 200_000, type: "Hard Bid", status: "Closed — Won", submitted: "Jun 12, 2022", equity: "1.8%", escrow: "ESC-2022-0017" },
];

const FOUNDER_BIDS = [
  { id: "b1", investor: "Meridian Capital", amount: 1_200_000, type: "Hard Bid", status: "In Escrow", submitted: "2 days ago", equity: "18%" },
  { id: "b2", investor: "Gulf Ventures", amount: 800_000, type: "Hard Bid", status: "Under Review", submitted: "3 days ago", equity: "12%" },
  { id: "b3", investor: "Pacific Growth Partners", amount: 500_000, type: "Soft Commit", status: "Pending NDA", submitted: "4 days ago", equity: "TBD" },
  { id: "b4", investor: "IndoTech Capital", amount: 250_000, type: "Soft Commit", status: "Interested", submitted: "5 days ago", equity: "TBD" },
];

const VDR_ACCESS_LOG = [
  { investor: "James Pemberton", firm: "Meridian Capital", location: "London, UK", time: "Today, 14:32", docs: ["Pitch Deck", "Financial Model"], verified: true },
  { investor: "Sun Wei", firm: "Pacific Growth Partners", location: "Hong Kong", time: "Today, 11:07", docs: ["Cap Table", "Pitch Deck"], verified: true },
  { investor: "Rania Al-Fayed", firm: "Gulf Ventures", location: "Riyadh, SA", time: "Yesterday, 16:45", docs: ["Financial Model", "Term Sheet"], verified: true },
  { investor: "Henrik Strauss", firm: "Bayern Equity", location: "Munich, DE", time: "Yesterday, 09:12", docs: ["Pitch Deck"], verified: false },
  { investor: "Aditi Chopra", firm: "IndoTech Capital", location: "Mumbai, IN", time: "3 days ago", docs: ["Business Plan", "Financial Model"], verified: true },
];

const CHAPTERS_DATA = [
  { region: "Middle East", name: "WTC Dubai", city: "Dubai, UAE", active: 12 },
  { region: "Middle East", name: "WTC Abu Dhabi", city: "Abu Dhabi, UAE", active: 7 },
  { region: "Middle East", name: "WTC Riyadh", city: "Riyadh, SA", active: 9 },
  { region: "Asia Pacific", name: "WTC Singapore", city: "Singapore", active: 18 },
  { region: "Asia Pacific", name: "WTC Tokyo", city: "Tokyo, Japan", active: 11 },
  { region: "Asia Pacific", name: "WTC Mumbai", city: "Mumbai, India", active: 14 },
  { region: "Asia Pacific", name: "WTC Shanghai", city: "Shanghai, China", active: 22 },
  { region: "Europe", name: "WTC Berlin", city: "Berlin, Germany", active: 8 },
  { region: "Europe", name: "WTC London", city: "London, UK", active: 25 },
  { region: "Europe", name: "WTC Paris", city: "Paris, France", active: 13 },
  { region: "Americas", name: "WTC New York", city: "New York, USA", active: 31 },
  { region: "Americas", name: "WTC Boston", city: "Boston, USA", active: 16 },
  { region: "Americas", name: "WTC Miami", city: "Miami, USA", active: 9 },
  { region: "Africa", name: "WTC Johannesburg", city: "Johannesburg, SA", active: 5 },
  { region: "Africa", name: "WTC Lagos", city: "Lagos, Nigeria", active: 4 },
];

// ─── LOGO ─────────────────────────────────────────────────────────────────────

function BrandLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="World Trade Centre Accra Investment Exchange">
      <div className="w-1 h-9 rounded-full" style={{ backgroundColor: B.orange }} aria-hidden="true" />
      {!collapsed && (
        <div className="leading-tight text-left">
          <div className="text-[13px] font-bold tracking-wide" style={{ color: B.navy }}>
            WTC ACCRA
          </div>
          <div className="text-[10px] tracking-[0.16em]" style={{ color: B.mgray }}>
            INVESTMENT EXCHANGE
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "In Escrow": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
    "Pending NDA": "bg-blue-50 text-blue-700 border-blue-200",
    "Interested": "bg-gray-100 text-gray-600 border-gray-200",
    "Countered": "bg-orange-50 text-orange-700 border-orange-200",
    "NDA Pending": "bg-blue-50 text-blue-700 border-blue-200",
    "Closed — Won": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Active": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Exited": "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

function MatchPill({ score }: { score: number }) {
  const color = score >= 90 ? "text-emerald-600" : score >= 80 ? "text-amber-600" : "text-gray-500";
  return (
    <span className={`flex items-center gap-1 text-xs font-mono ${color}`}>
      <Zap className="w-3 h-3" />{score}% match
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: B.orange }}>{children}</div>;
}

function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "2rem", lineHeight: 1.2, color: B.navy, fontWeight: 700 }}>
      {children}
    </h2>
  );
}

function KPICard({ label, value, delta, up, Icon }: { label: string; value: string; delta: string; up?: boolean; Icon: React.ElementType }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${B.navy}12` }}>
          <Icon className="w-4 h-4" style={{ color: B.navy }} />
        </div>
      </div>
      <div className="text-xl font-mono font-semibold mb-1" style={{ color: B.navy }}>{value}</div>
      {delta && (
        <div className={`flex items-center gap-1 text-xs font-mono ${up !== false ? "text-emerald-600" : "text-red-500"}`}>
          {up !== false ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {delta}
        </div>
      )}
    </div>
  );
}

function CurrencySwitcher({ currency, setCurrency }: { currency: Currency; setCurrency: (c: Currency) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-xs font-mono border border-border px-3 py-1.5 rounded-md hover:border-primary transition-colors bg-white">
        <span style={{ color: B.navy }} className="font-semibold">{currency}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-50 py-1 min-w-[100px]">
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => { setCurrency(c); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-secondary transition-colors ${c === currency ? "font-bold" : ""}`}
              style={{ color: c === currency ? B.navy : "#6B7280" }}>
              {c} {SYM[c].trim()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DEAL CARD (shared) ───────────────────────────────────────────────────────

function DealCard({ deal, currency, onViewDeal }: { deal: Deal; currency: Currency; onViewDeal: (d: Deal) => void }) {
  const pct = Math.round((deal.committed / deal.target) * 100);
  return (
    <div className="bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: deal.bg }}>
              {deal.initials}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: B.navy }}>{deal.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{deal.city} · {deal.wtcChapter}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-mono border border-border px-2 py-0.5 rounded bg-secondary text-muted-foreground">{deal.sector}</span>
            <span className="text-xs font-mono text-muted-foreground">{deal.stage}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pt-4 pb-3 flex-1">
        <p className="text-xs text-muted-foreground leading-relaxed">{deal.description}</p>
      </div>
      <div className="px-5 py-3 grid grid-cols-3 gap-3 border-t border-border bg-secondary/30">
        {([["Target", fmt(deal.target, currency)], ["Min Ticket", fmt(deal.minTicket, currency)], ["IRR", deal.irr]] as [string, string][]).map(([l, v]) => (
          <div key={l}>
            <div className="text-xs font-mono text-muted-foreground mb-0.5">{l}</div>
            <div className="text-xs font-mono font-semibold" style={{ color: B.navy }}>{v}</div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-border">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground"><span className="font-mono font-semibold" style={{ color: B.navy }}>{fmt(deal.committed, currency)}</span> committed</span>
          <span className="font-mono font-semibold" style={{ color: B.orange }}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: B.navy }} />
        </div>
      </div>
      <div className="px-5 py-4 border-t border-border flex items-center justify-between">
        <MatchPill score={deal.matchScore} />
        <button onClick={() => onViewDeal(deal)}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-all text-white"
          style={{ backgroundColor: deal.ndaSigned ? B.navy : B.orange }}>
          {deal.ndaSigned ? "View VDR" : "Sign NDA"}
        </button>
      </div>
    </div>
  );
}

// ─── NAV BAR ─────────────────────────────────────────────────────────────────

function NavBar({ view, setView }: { view: View; setView: (v: View) => void }) {
  const links: [string, View][] = [["How it works", "platform"], ["Opportunities", "deals"], ["Trade network", "chapters"], ["About", "about"]];
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView("home")} className="flex-shrink-0">
          <BrandLogo />
        </button>
        <div className="hidden md:flex items-center gap-8">
          {links.map(([label, v]) => (
            <button key={v} onClick={() => setView(v)}
              className="text-sm font-medium transition-colors"
              style={{ color: view === v ? B.navy : "#6B7280" }}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setView("login")}
            className="hidden md:block text-sm font-medium border border-border px-4 py-1.5 rounded-lg hover:border-primary transition-all"
            style={{ color: B.navy }}>
            Sign in
          </button>
          <button onClick={() => setView("register")}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: B.orange }}>
            Join
          </button>
        </div>
      </div>
    </nav>
  );
}

function PublicFooter({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="border-t border-border bg-secondary/30 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <BrandLogo />
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">A curated deal discovery platform by World Trade Centre Accra, connecting credible opportunities in Ghana and Africa with qualified global investors.</p>
          </div>
          {[
            ["Platform", ["Features", "How It Works", "Security", "Pricing"]],
            ["Company", ["About", "Chapters", "Press", "Careers"]],
            ["Legal", ["Privacy Policy", "Terms of Service", "Compliance", "KYC Policy"]],
          ].map(([heading, items]) => (
            <div key={heading as string}>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: B.navy }}>{heading}</div>
              <ul className="space-y-2">
                {(items as string[]).map((i) => <li key={i}><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{i}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} World Trade Centre Accra. Connecting Businesses, Globally.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Compliance", "Contact"].map((l) => (
              <a key={l} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.ElementType };

function Sidebar({ items, active, setActive, onBack, userInitials, userName, userRole }: {
  items: NavItem[]; active: string; setActive: (id: string) => void;
  onBack: () => void; userInitials: string; userName: string; userRole: string;
}) {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-white flex flex-col">
      <div className="h-16 border-b border-border px-5 flex items-center">
        <BrandLogo />
      </div>
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: B.navy }}>
            {userInitials}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: B.navy }}>{userName}</div>
            <div className="text-xs text-muted-foreground">{userRole}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${active === id ? "text-white font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            style={active === id ? { backgroundColor: B.navy } : {}}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-0.5">
        <button onClick={() => setActive("settings")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-all">
          <Settings className="w-4 h-4" />Settings
        </button>
        <button onClick={onBack}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-all">
          <LogOut className="w-4 h-4" />Back to Site
        </button>
      </div>
    </aside>
  );
}

function DashTopBar({ title, currency, setCurrency, badge }: { title: string; currency: Currency; setCurrency: (c: Currency) => void; badge?: string }) {
  return (
    <div className="h-14 border-b border-border px-6 flex items-center justify-between bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold" style={{ color: B.navy }}>{title}</span>
        {badge && <span className="text-xs font-mono px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: B.orange }}>{badge}</span>}
      </div>
      <div className="flex items-center gap-3">
        <CurrencySwitcher currency={currency} setCurrency={setCurrency} />
        <button className="relative w-9 h-9 flex items-center justify-center border border-border rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: B.orange }} />
        </button>
        <button className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: B.navy }}>JP</div>
        </button>
      </div>
    </div>
  );
}

// ─── PUBLIC PAGES ─────────────────────────────────────────────────────────────

function HomePage({ setView, onViewDeal }: { setView: (v: View) => void; onViewDeal: (d: Deal) => void }) {
  return (
    <div>
      <NavBar view="home" setView={setView} />
      <div className="pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#09294f] text-white min-h-[660px] flex items-center">
          <img src="/images/accra-investment-market-hero.webp" alt="Accra connected to global capital markets and trade routes" className="absolute inset-0 w-full h-full object-cover object-center" fetchPriority="high" />
          <div className="absolute inset-0 bg-[#09294f]/45" aria-hidden="true" />
          <div className="max-w-7xl mx-auto w-full px-6 py-24 relative z-10">
            <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs border px-4 py-1.5 rounded-full mb-8 bg-white/10 border-white/25 text-white">
              <Award className="w-3.5 h-3.5" style={{ color: B.orange }} />
              Curated by World Trade Centre Accra
            </div>
            <h1 className="mb-6 font-bold" style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 1.02 }}>
              Invest in Africa's<br />
              <span style={{ color: B.peach }}>next growth story.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-xl mb-9 leading-relaxed">
              Discover vetted, investment ready opportunities from Ghana and across Africa, or present your deal to a trusted global business network.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setView("deals")} className="px-6 py-3 rounded-lg text-sm font-bold text-white hover:-translate-y-0.5 transition-all" style={{ backgroundColor: B.orange }}>
                Explore opportunities
              </button>
              <button onClick={() => setView("list-project")} className="px-6 py-3 rounded-lg text-sm font-bold border border-white/40 bg-white/10 text-white hover:bg-white/15 transition-all">
                Post a deal
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-white/70">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#09D0AC]" /> Due diligence workflow</span>
              <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-[#09D0AC]" /> Secure data rooms</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-[#09D0AC]" /> Global investor reach</span>
            </div>
            </div>
          </div>
        </section>
        <div className="bg-[#0b2342] border-t border-white/10 overflow-hidden" aria-label="Market focus sectors">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-7 gap-y-2 text-[11px] font-mono text-white/70">
            <span className="uppercase tracking-widest text-[#F9A25E]">Market focus</span>
            {["FinTech +2.8%", "AgriTech +1.6%", "Healthcare +3.2%", "Energy +2.1%", "Infrastructure +1.4%"].map((item) => <span key={item} className="flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-[#09D0AC]" />{item}</span>)}
          </div>
        </div>
        {/* Stats */}
        <div className="border-y border-border">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-5 gap-6">
            {[["128", "Active Deals"], ["340", "Verified Investors"], ["$1.4B", "Capital Sought"], ["37", "Closed Deals"], ["14", "Sectors"]].map(([v, l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-mono font-bold mb-1" style={{ color: B.navy }}>{v}</div>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <section className="py-20 px-6 bg-[#f7f9fc] border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-10">
              <SectionLabel>One trusted environment</SectionLabel>
              <PageTitle>Built for both sides of the deal</PageTitle>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">Standardised profiles, controlled diligence and human curation reduce noise while helping serious opportunities and relevant capital find each other.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                [Building2, "For private companies", "List your funding round, assess deal readiness and present your opportunity to vetted investors actively deploying capital.", "Raise capital", "register"],
                [TrendingUp, "For investors", "Define sector, ticket size, geography and stage preferences, then receive deal flow aligned to your mandate.", "Source deals", "deals"],
                [Shield, "Secure and curated", "Use digital NDAs, permissioned data rooms, access logs and WTC Accra supported introductions.", "How it works", "platform"],
              ].map(([Icon, title, copy, action, target]) => (
                <article key={title as string} className="bg-white border border-border rounded-xl p-6 hover:-translate-y-1 hover:shadow-md transition-all">
                  {React.createElement(Icon as React.ElementType, { className: "w-6 h-6 mb-5", style: { color: B.orange } })}
                  <h3 className="font-bold mb-2" style={{ color: B.navy }}>{title as string}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed min-h-16">{copy as string}</p>
                  <button onClick={() => setView(target as View)} className="mt-5 text-xs font-bold" style={{ color: B.orange }}>{action as string} →</button>
                </article>
              ))}
            </div>
          </div>
        </section>
        {/* Featured deals */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <SectionLabel>Live Deals</SectionLabel>
                <PageTitle>Featured Opportunities</PageTitle>
              </div>
              <button onClick={() => setView("deals")} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: B.orange }}>
                View all deals <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {DEALS.slice(0, 3).map((d) => <DealCard key={d.id} deal={d} currency="USD" onViewDeal={onViewDeal} />)}
            </div>
          </div>
        </section>
        {/* How it works */}
        <section className="py-20 px-6 border-t border-border bg-secondary/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <SectionLabel>How It Works</SectionLabel>
              <PageTitle>The Full Investment Lifecycle</PageTitle>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                [Shield, "01", "Submit & verify", "Deal owners complete identity, company and beneficial ownership checks."],
                [CheckCircle2, "02", "Curate & prepare", "WTC Accra reviews the opportunity and prepares it for investor discovery."],
                [Lock, "03", "Review securely", "Qualified investors sign an NDA before accessing controlled due diligence files."],
                [Gavel, "04", "Connect & progress", "Both parties move from interest to meetings, diligence and documented next steps."],
              ].map(([Icon, step, title, desc]) => (
                <div key={title as string} className="p-5 border border-border rounded-xl bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${B.navy}10` }}>
                      {React.createElement(Icon as React.ElementType, { className: "w-4 h-4", style: { color: B.navy } })}
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: B.orange }}>Step {step}</span>
                  </div>
                  <div className="font-semibold text-sm mb-2" style={{ color: B.navy }}>{title as string}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{desc as string}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <PublicFooter setView={setView} />
      </div>
    </div>
  );
}

function PlatformPage({ setView }: { setView: (v: View) => void }) {
  const features = [
    [Lock, "Virtual Data Room", "Dynamic watermarking stamps every document with the downloader's identity, IP address, and timestamp. Full immutable audit trail maintained per file."],
    [Zap, "AI Match Engine", "Python cosine-similarity microservice matches across check size, sector, stage, and geographic mandate — serving highest-confidence opportunities first."],
    [Shield, "Escrow-Linked Bids", "Zero platform custody. All capital holds and milestone releases are fully delegated to licensed third-party escrow providers via secure API."],
    [DollarSign, "Multi-Currency FX", "60-second Redis-cached live rates enable real-time recalculation across USD, EUR, AED, JPY, GBP, SGD, and 20+ additional currencies."],
    [CheckCircle2, "KYC/AML Compliance", "Integrated Persona/Sumsub identity verification, investor accreditation audits, and mandatory WTC chapter membership validation."],
    [Star, "Reputation Ledger", "KYC-backed peer reviews score founder transparency and investor reliability — non-editable, append-only trust history on every profile."],
  ];
  return (
    <div>
      <NavBar view="platform" setView={setView} />
      <div className="pt-16">
        <section className="py-20 px-6 bg-secondary/20">
          <div className="max-w-4xl mx-auto text-center">
            <SectionLabel>The Platform</SectionLabel>
            <h1 style={{ fontSize: "3rem", lineHeight: 1.1, color: B.navy, fontWeight: 700 }} className="mb-6">
              Institutional-Grade Infrastructure<br />for Private Markets
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">End-to-end deal management — from KYC onboarding through AI matching, watermarked VDR access, escrow-linked bidding, and post-close reputation tracking.</p>
          </div>
        </section>
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Platform Capabilities</SectionLabel>
              <PageTitle>Built for Institutional-Grade Deals</PageTitle>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(([Icon, title, desc]) => (
                <div key={title as string} className="p-6 border border-border rounded-xl bg-white hover:shadow-md transition-all group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${B.navy}0F` }}>
                    {React.createElement(Icon as React.ElementType, { className: "w-5 h-5", style: { color: B.navy } })}
                  </div>
                  <div className="font-semibold text-sm mb-2" style={{ color: B.navy }}>{title as string}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{desc as string}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16 px-6 border-t border-border bg-secondary/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Integration Partners</SectionLabel>
              <PageTitle>Enterprise Stack</PageTitle>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[["Persona / Sumsub", "KYC & AML"], ["Plaid / Stripe Connect", "Fiat Wallet"], ["WalletConnect", "Web3 Proof of Funds"], ["Qualified / Escrow.com", "Escrow API"], ["Redis Cloud", "FX Rate Cache"], ["PostgreSQL + Prisma", "Database ORM"], ["FastAPI (Python)", "Matching Engine"], ["Socket.io", "Real-time Events"]].map(([name, cat]) => (
                <div key={name} className="p-4 border border-border rounded-xl bg-white text-center">
                  <div className="font-medium text-sm mb-1" style={{ color: B.navy }}>{name}</div>
                  <div className="text-xs font-mono text-muted-foreground">{cat}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <PublicFooter setView={setView} />
      </div>
    </div>
  );
}

function DealsPage({ setView, onViewDeal }: { setView: (v: View) => void; onViewDeal: (d: Deal) => void }) {
  const [sector, setSector] = useState("All");
  const [stage, setStage] = useState("All");
  const [search, setSearch] = useState("");
  const [currency] = useState<Currency>("USD");
  const sectors = ["All", "FinTech", "AgriTech", "Healthcare", "Technology", "Real Estate", "Energy"];
  const stages = ["All", "Seed", "Series A", "Series B", "Growth"];
  const filtered = DEALS.filter((d) =>
    (sector === "All" || d.sector === sector) &&
    (stage === "All" || d.stage === stage) &&
    (search === "" || d.name.toLowerCase().includes(search.toLowerCase()) || d.city.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div>
      <NavBar view="deals" setView={setView} />
      <div className="pt-16">
        <section className="relative py-16 px-6 border-b border-border overflow-hidden">
          <img src="/images/deal-review-boardroom.webp" alt="Investment team reviewing African private market opportunities" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-white/88" aria-hidden="true" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-6">
              <SectionLabel>Marketplace</SectionLabel>
              <PageTitle>Browse Verified Deals</PageTitle>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company, city, or keyword…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => (
                  <button key={s} onClick={() => setSector(s)}
                    className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${sector === s ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"}`}
                    style={sector === s ? { backgroundColor: B.navy } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground font-mono">{filtered.length} deal{filtered.length !== 1 ? "s" : ""} matching</span>
              <div className="flex gap-2">
                {stages.map((s) => (
                  <button key={s} onClick={() => setStage(s)}
                    className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${stage === s ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
                    style={stage === s ? { backgroundColor: B.orange } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((d) => <DealCard key={d.id} deal={d} currency={currency} onViewDeal={onViewDeal} />)}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No deals match your filters.</p>
              </div>
            )}
          </div>
        </section>
        <PublicFooter setView={setView} />
      </div>
    </div>
  );
}

function ChaptersPage({ setView }: { setView: (v: View) => void }) {
  const [region, setRegion] = useState("All");
  const regions = ["All", "Middle East", "Asia Pacific", "Europe", "Americas", "Africa"];
  const filtered = region === "All" ? CHAPTERS_DATA : CHAPTERS_DATA.filter((c) => c.region === region);
  const regionColors: Record<string, string> = { "Middle East": B.orange, "Asia Pacific": B.teal, "Europe": B.navy, "Americas": B.blue, "Africa": B.yellow };
  return (
    <div>
      <NavBar view="chapters" setView={setView} />
      <div className="pt-16">
        <section className="py-14 px-6 border-b border-border bg-secondary/20">
          <div className="max-w-4xl mx-auto text-center">
            <SectionLabel>Global Network</SectionLabel>
            <h1 style={{ fontSize: "2.75rem", lineHeight: 1.1, color: B.navy, fontWeight: 700 }} className="mb-4">Local insight.<br />Global connections.</h1>
            <p className="text-muted-foreground leading-relaxed">Every deal on the platform is anchored by a verified World Trade Center chapter — your assurance of institutional membership and local due diligence.</p>
          </div>
        </section>
        <section className="py-14 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-8">
              {regions.map((r) => (
                <button key={r} onClick={() => setRegion(r)}
                  className={`text-xs font-mono px-4 py-2 rounded-full border transition-all ${region === r ? "text-white border-transparent" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"}`}
                  style={region === r ? { backgroundColor: regionColors[r] || B.navy } : {}}>
                  {r}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <div key={c.name} className="p-5 border border-border rounded-xl bg-white hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-sm" style={{ color: B.navy }}>{c.name}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{c.city}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: regionColors[c.region] || B.navy }}>{c.region}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">{c.active} active deals</span>
                    <button className="font-medium" style={{ color: B.orange }}>View deals →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <PublicFooter setView={setView} />
      </div>
    </div>
  );
}

function AboutPage({ setView }: { setView: (v: View) => void }) {
  return (
    <div>
      <NavBar view="about" setView={setView} />
      <div className="pt-16">
        <section className="relative py-28 px-6 overflow-hidden bg-[#154074]">
          <img src="/images/africa-trade-network.webp" alt="African trade and investment network connected through Accra" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#154074]/65" aria-hidden="true" />
          <div className="max-w-5xl mx-auto relative z-10">
            <h1 style={{ fontSize: "3rem", lineHeight: 1.1, color: "white", fontWeight: 700 }} className="mb-6">
              Where African opportunity<br /><span style={{ color: B.peach }}>meets institutional capital.</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl">
              WTC Accra Investment Exchange is a secure, curated deal sourcing environment for growth stage companies, private equity, venture capital, family offices and development finance institutions.
            </p>
          </div>
        </section>
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div>
              <SectionLabel>Our Mission</SectionLabel>
              <PageTitle>Making cross border capital more trusted</PageTitle>
              <p className="text-muted-foreground text-sm leading-relaxed mt-4 mb-4">
                World Trade Centre Accra combines local market knowledge, a global business network and structured digital workflows to help credible companies become easier for qualified investors to discover and assess.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The platform does not replace professional advice or guarantee funding. It improves readiness, controlled information sharing and high quality introductions so both parties can move into diligence with clearer expectations.
              </p>
            </div>
            <div className="space-y-4">
              {[["Company pathway", "Submit → review → publish"], ["Investor pathway", "Mandate → match → diligence"], ["Core controls", "KYC, NDA and access logs"], ["Coverage", "Ghana and African markets"], ["Deal stages", "Seed to growth equity"], ["Introductions", "Human led and confidential"]].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between p-4 border border-border rounded-xl bg-white">
                  <span className="text-sm text-muted-foreground">{l}</span>
                  <span className="text-sm font-semibold font-mono" style={{ color: B.navy }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="py-16 px-6 border-t border-border bg-secondary/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Our principles</SectionLabel>
              <PageTitle>Trust before transaction</PageTitle>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                [Shield, "Curated access", "Submissions are reviewed before they become visible to the wider marketplace."],
                [FileText, "Decision useful information", "Standardised deal profiles help investors compare opportunities more efficiently."],
                [Lock, "Confidential by design", "Sensitive materials remain controlled through NDAs, permissions and access logs."],
                [Users, "Human led introductions", "WTC Accra supports context rich connections rather than anonymous lead generation."],
                [Globe, "Cross border perspective", "Local insight is presented in a format international capital providers can assess."],
                [Activity, "Outcome tracking", "Introductions, meetings, diligence and next steps can be followed through a single pipeline."],
              ].map(([Icon, title, note]) => (
                <div key={title as string} className="p-6 border border-border rounded-xl bg-white">
                  {React.createElement(Icon as React.ElementType, { className: "w-5 h-5 mb-4", style: { color: B.orange } })}
                  <div className="font-semibold text-sm mb-2" style={{ color: B.navy }}>{title as string}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{note as string}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <PublicFooter setView={setView} />
      </div>
    </div>
  );
}

function LoginPage({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden" style={{ backgroundColor: B.navy }}>
        <img src="/images/deal-review-boardroom.webp" alt="Institutional investors reviewing a deal" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#154074]/82" aria-hidden="true" />
        <div className="relative z-10"><BrandLogo /></div>
        <div className="relative z-10">
          <h2 style={{ fontSize: "2.5rem", lineHeight: 1.15, color: "white", fontWeight: 700 }} className="mb-4">
            Your gateway to<br /><em style={{ color: B.peach }}>verified global deals</em>
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">Access curated African investment opportunities with structured verification, secure diligence and trusted introductions.</p>
          <div className="grid grid-cols-2 gap-4">
            {[["$2.4B", "Capital deployed"], ["847", "Verified projects"], ["94", "WTC Chapters"], ["9.4/10", "Avg trust score"]].map(([v, l]) => (
              <div key={l} className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div className="text-xl font-mono font-bold text-white">{v}</div>
                <div className="text-xs text-blue-300 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-blue-300 relative z-10">© {new Date().getFullYear()} World Trade Centre Accra</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><BrandLogo /></div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2" style={{ color: B.navy }}>Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your investor account</p>
          </div>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="james@meridian.capital"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
          <button onClick={() => setView("investor")}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm hover:opacity-90 transition-opacity mb-4"
            style={{ backgroundColor: B.navy }}>
            Sign In
          </button>
          <button className="w-full py-3 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors mb-6" style={{ color: B.navy }}>
            Sign in with Google Workspace
          </button>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">Not registered yet?</p>
            <button onClick={() => setView("register")} className="text-xs font-medium" style={{ color: B.orange }}>
              Create an account →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage({ setView }: { setView: (v: View) => void }) {
  const [role, setRole] = useState<"company" | "investor">("company");
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <NavBar view="register" setView={setView} />
      <div className="pt-16 grid lg:grid-cols-[0.9fr_1.1fr] min-h-screen">
        <section className="relative hidden lg:flex items-end p-12 overflow-hidden bg-[#154074]">
          <img src="/images/africa-trade-network.webp" alt="African markets connected to global trade" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#154074]/72" aria-hidden="true" />
          <div className="relative z-10 text-white max-w-lg">
            <div className="text-xs uppercase tracking-[0.2em] text-[#F9A25E] mb-4">Join the exchange</div>
            <h1 className="text-4xl font-bold leading-tight mb-5">Build the right connections around your mandate.</h1>
            <p className="text-white/75 text-sm leading-relaxed">Create a company or investor profile, complete verification and access a curated environment designed for serious private market conversations.</p>
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-14">
          <div className="w-full max-w-xl bg-white border border-border rounded-2xl p-7 md:p-9 shadow-sm">
            <SectionLabel>Account application</SectionLabel>
            <h2 className="text-2xl font-bold mb-2" style={{ color: B.navy }}>How will you use the platform?</h2>
            <p className="text-sm text-muted-foreground mb-7">Choose a pathway. Every account is reviewed before marketplace access is activated.</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-7">
              {[
                { id: "company", Icon: Building2, title: "Private company", copy: "Raise capital, assess readiness and manage investor diligence." },
                { id: "investor", Icon: TrendingUp, title: "Investor", copy: "Define your mandate and receive relevant, curated deal flow." },
              ].map(({ id, Icon, title, copy }) => (
                <button key={id} onClick={() => setRole(id as "company" | "investor")} className="p-4 rounded-xl border-2 text-left transition-all" style={{ borderColor: role === id ? B.orange : "#ECECEF", backgroundColor: role === id ? "#fff8f3" : "white" }}>
                  <Icon className="w-5 h-5 mb-3" style={{ color: role === id ? B.orange : B.navy }} />
                  <div className="font-semibold text-sm mb-1" style={{ color: B.navy }}>{title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{copy}</div>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {["Full name", "Work email", "Organisation", "Country"].map((label) => (
                <label key={label} className="text-xs font-medium text-muted-foreground">
                  {label}
                  <input className="mt-1.5 w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" placeholder={label} type={label === "Work email" ? "email" : "text"} />
                </label>
              ))}
            </div>
            <label className="flex items-start gap-3 mt-5 text-xs text-muted-foreground leading-relaxed">
              <input type="checkbox" className="mt-0.5" />
              I confirm that the information supplied is accurate and agree to the platform terms, privacy notice and verification checks.
            </label>
            <button onClick={() => setView(role === "company" ? "list-project" : "investor")} className="w-full mt-6 py-3 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: B.orange }}>
              Continue as {role === "company" ? "a company" : "an investor"} →
            </button>
            <p className="text-center text-xs text-muted-foreground mt-5">Already registered? <button onClick={() => setView("login")} style={{ color: B.navy }} className="font-semibold">Sign in</button></p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ListProjectPage({ setView }: { setView: (v: View) => void }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("Professional");
  const plans = [
    { name: "Starter", price: 299, features: ["1 project listing", "Standard VDR", "20 NDA requests", "Basic AI matching"] },
    { name: "Professional", price: 799, features: ["3 project listings", "Advanced VDR + audit logs", "Unlimited NDAs", "Priority AI matching", "Syndicate pool access"] },
    { name: "Enterprise", price: 2499, features: ["Unlimited projects", "White-glove onboarding", "Custom NDAs", "Exclusive chapter matching", "24/7 priority support"] },
  ];
  return (
    <div>
      <NavBar view="list-project" setView={setView} />
      <div className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-10">
            <SectionLabel>Get Started</SectionLabel>
            <h1 style={{ fontSize: "2.25rem", color: B.navy, fontWeight: 700 }}>Post Your Deal</h1>
            <p className="text-muted-foreground text-sm mt-2">Connect with 12,400+ accredited investors through the WTC global network.</p>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            {["Choose Plan", "Company Details", "Deal Information"].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? "text-white" : "border border-border text-muted-foreground"}`}
                    style={i + 1 <= step ? { backgroundColor: B.navy } : {}}>
                    {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? "" : "text-muted-foreground"}`}
                    style={i + 1 === step ? { color: B.navy } : {}}>{s}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-border" />}
              </React.Fragment>
            ))}
          </div>
          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground mb-6">Select the plan that best fits your fundraising needs.</p>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {plans.map((p) => (
                  <div key={p.name} onClick={() => setPlan(p.name)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${plan === p.name ? "" : "border-border bg-white"}`}
                    style={plan === p.name ? { borderColor: B.navy, backgroundColor: `${B.navy}05` } : {}}>
                    {p.name === "Professional" && <div className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded-full mb-3 inline-block" style={{ backgroundColor: B.orange }}>Popular</div>}
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{p.name}</div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-mono font-bold" style={{ color: B.navy }}>${p.price}</span>
                      <span className="text-muted-foreground text-xs">/mo</span>
                    </div>
                    <ul className="space-y-2">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: B.teal }} />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="px-8 py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: B.navy }}>
                Continue with {plan} →
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">Tell us about your company.</p>
              {[["Company Name", "text", "Nexus AI Ltd"], ["Legal Entity", "text", "Registered company name"], ["Founded Year", "number", "2021"], ["WTC Chapter", "text", "WTC Dubai"], ["Sector", "text", "Technology"], ["Number of Employees", "number", "48"]].map(([label, type, placeholder]) => (
                <div key={label as string}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                  <input type={type as string} placeholder={placeholder as string}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">← Back</button>
                <button onClick={() => setStep(3)} className="px-8 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: B.navy }}>Continue →</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">Tell us about your fundraising round.</p>
              {[["Fundraising Stage", "text", "Series A"], ["Target Raise (USD)", "number", "15000000"], ["Minimum Ticket Size (USD)", "number", "250000"], ["Target IRR (%)", "text", "24–32%"], ["Use of Funds", "text", "R&D 40%, Sales 30%, Ops 20%, Legal 10%"]].map(([label, type, placeholder]) => (
                <div key={label as string}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
                  <input type={type as string} placeholder={placeholder as string}
                    className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">← Back</button>
                <button onClick={() => setView("founder")} className="px-8 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: B.orange }}>
                  Submit Application →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT DETAIL PAGE ──────────────────────────────────────────────────────

function ProjectDetailPage({ deal, setView, onBack, currency }: { deal: Deal; setView: (v: View) => void; onBack: () => void; currency: Currency }) {
  const [tab, setTab] = useState("overview");
  const pct = Math.round((deal.committed / deal.target) * 100);
  const tabs = ["overview", "team", "financials", "documents", "bid"];
  return (
    <div className="min-h-screen bg-background">
      <NavBar view="deals" setView={setView} />
      <div className="pt-16">
        {/* Hero */}
        <div className="border-b border-border py-8 px-6 bg-secondary/20">
          <div className="max-w-6xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ChevronLeft className="w-4 h-4" /> Back to Deals
            </button>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ backgroundColor: deal.bg }}>
                  {deal.initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold mb-1" style={{ color: B.navy }}>{deal.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{deal.city}, {deal.country}</span>
                    <span>· {deal.wtcChapter}</span>
                    <span className="border border-border px-2 py-0.5 rounded-full text-xs bg-white">{deal.sector}</span>
                    <span className="border border-border px-2 py-0.5 rounded-full text-xs bg-white">{deal.stage}</span>
                  </div>
                  <MatchPill score={deal.matchScore} />
                </div>
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <div className="text-2xl font-mono font-bold" style={{ color: B.navy }}>{fmt(deal.target, currency)}</div>
                <div className="text-xs text-muted-foreground">target raise</div>
                <div className="w-40 h-2 bg-secondary rounded-full mt-1">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: deal.bg }} />
                </div>
                <div className="text-xs font-mono" style={{ color: B.orange }}>{fmt(deal.committed, currency)} committed ({pct}%)</div>
              </div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="border-b border-border bg-white">
          <div className="max-w-6xl mx-auto px-6 flex gap-1">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-3.5 text-sm font-medium capitalize border-b-2 transition-all ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                style={tab === t ? { borderColor: B.navy, color: B.navy } : {}}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {tab === "overview" && (
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="font-semibold text-base mb-3" style={{ color: B.navy }}>About the Company</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{deal.longDesc}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-3" style={{ color: B.navy }}>Key Milestones</h3>
                  <div className="space-y-2">
                    {deal.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: B.teal }} />
                        <span className="text-muted-foreground">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-3" style={{ color: B.navy }}>Use of Funds</h3>
                  <div className="space-y-2">
                    {deal.useOfFunds.map(([cat, pctStr]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{cat}</span>
                        <div className="flex-1 h-1.5 bg-secondary rounded-full">
                          <div className="h-full rounded-full" style={{ width: pctStr, backgroundColor: deal.bg }} />
                        </div>
                        <span className="text-xs font-mono font-semibold w-8 text-right" style={{ color: B.navy }}>{pctStr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {[["Min Ticket", fmt(deal.minTicket, currency)], ["Target IRR", deal.irr], ["Founded", String(deal.founded)], ["Employees", String(deal.employees)], ["WTC Chapter", deal.wtcChapter]].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-3 border-b border-border text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-mono font-semibold" style={{ color: B.navy }}>{v}</span>
                  </div>
                ))}
                <button onClick={() => setTab("bid")} className="w-full py-3 rounded-lg text-white font-semibold text-sm mt-2" style={{ backgroundColor: B.orange }}>
                  {deal.ndaSigned ? "Submit a Bid" : "Sign NDA to Proceed"}
                </button>
              </div>
            </div>
          )}
          {tab === "team" && (
            <div>
              <h3 className="font-semibold text-base mb-6" style={{ color: B.navy }}>Leadership Team</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {deal.team.map(({ n, r }) => (
                  <div key={n} className="p-5 border border-border rounded-xl bg-white">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white mb-3" style={{ backgroundColor: deal.bg }}>
                      {n.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                    </div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: B.navy }}>{n}</div>
                    <div className="text-xs text-muted-foreground">{r}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "financials" && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-base mb-6" style={{ color: B.navy }}>Key Financials</h3>
                <div className="space-y-3">
                  {[["Annual Revenue", fmt(deal.financials.revenue, currency)], ["YoY Growth", deal.financials.growth], ["Gross Margin", deal.financials.margin], ["Monthly Burn", deal.financials.burnRate > 0 ? fmt(deal.financials.burnRate, currency) : "Cash-flow positive"]].map(([l, v]) => (
                    <div key={l} className="flex justify-between p-4 border border-border rounded-xl bg-white text-sm">
                      <span className="text-muted-foreground">{l}</span>
                      <span className="font-mono font-bold" style={{ color: B.navy }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 border border-border rounded-xl bg-white">
                <div className="text-sm font-semibold mb-1" style={{ color: B.navy }}>Note on Financials</div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  Full audited financials, cap table, and financial model are available in the Virtual Data Room. Sign the NDA to access detailed documents — all downloads are dynamically watermarked with your identity, IP address, and timestamp.
                </p>
                {!deal.ndaSigned && (
                  <button className="w-full mt-4 py-2.5 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: B.navy }}>
                    Sign NDA to Access VDR
                  </button>
                )}
                {deal.ndaSigned && (
                  <div className="flex items-center gap-2 mt-4 text-xs text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />NDA signed · VDR access granted
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === "documents" && (
            <div>
              {!deal.ndaSigned ? (
                <div className="text-center py-20">
                  <Lock className="w-10 h-10 mx-auto mb-4" style={{ color: B.navy }} />
                  <h3 className="font-semibold text-lg mb-2" style={{ color: B.navy }}>NDA Required</h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Please sign the Non-Disclosure Agreement to gain access to the Virtual Data Room documents.</p>
                  <button className="px-8 py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: B.orange }}>
                    Review & Sign NDA
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-secondary">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: B.orange }} />
                    All documents are dynamically watermarked with your identity (WTC-JP-8841), IP address, and download timestamp.
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {["Executive Summary", "Financial Model FY24", "Cap Table", "Pitch Deck v4", "Term Sheet Template", "Audited Accounts 2023"].map((doc) => (
                      <div key={doc} className="flex items-center justify-between p-4 border border-border rounded-xl bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5" style={{ color: B.navy }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: B.navy }}>{doc}</div>
                            <div className="text-xs text-muted-foreground">PDF · Watermarked</div>
                          </div>
                        </div>
                        <button className="flex items-center gap-1.5 text-xs font-medium" style={{ color: B.orange }}>
                          <Download className="w-3.5 h-3.5" />Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === "bid" && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-base mb-6" style={{ color: B.navy }}>Submit a Bid</h3>
                <div className="space-y-4">
                  {[["Bid Amount (USD)", "number", "500000"], ["Equity Requested (%)", "number", "3.5"], ["Investment Horizon (years)", "number", "5"], ["Escrow Account Reference", "text", "ESC-2024-XXXX"]].map(([l, t, p]) => (
                    <div key={l as string}>
                      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{l}</label>
                      <input type={t as string} placeholder={p as string}
                        className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Bid Type</label>
                    <select className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary">
                      <option>Hard Bid (Escrow-backed)</option>
                      <option>Soft Commit (Non-binding)</option>
                    </select>
                  </div>
                  <button className="w-full py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: B.navy }}>
                    Submit Bid →
                  </button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hard bids require an active escrow hold via a licensed third-party provider. WTC Investors Hub holds no capital at any stage of the transaction.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-5 border border-border rounded-xl bg-secondary/30">
                  <h4 className="font-semibold text-sm mb-4" style={{ color: B.navy }}>Current Bid Pipeline</h4>
                  {FOUNDER_BIDS.map((b) => (
                    <div key={b.id} className="flex justify-between items-center py-2.5 border-b border-border last:border-0 text-xs">
                      <div>
                        <span className="font-medium text-foreground">{b.investor}</span>
                        <span className="text-muted-foreground ml-2">{b.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold" style={{ color: B.navy }}>{fmt(b.amount, currency)}</span>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-5 border border-border rounded-xl bg-white">
                  <h4 className="font-semibold text-sm mb-2" style={{ color: B.navy }}>Escrow Partners</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">WTC Investors Hub integrates with Qualified.com and Escrow.com. All capital holds are managed by licensed escrow providers — the platform is zero-custody.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── INVESTOR DASHBOARD PAGES ─────────────────────────────────────────────────

function InvDealFlow({ currency, onViewDeal }: { currency: Currency; onViewDeal: (d: Deal) => void }) {
  const [sector, setSector] = useState("All");
  const sectors = ["All", "Technology", "Real Estate", "Energy", "Healthcare", "FinTech"];
  const filtered = sector === "All" ? DEALS : DEALS.filter((d) => d.sector === sector);
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold mb-0.5" style={{ color: B.navy }}>Deal Flow Intelligence</h2>
          <p className="text-xs text-muted-foreground">AI-matched opportunities ranked by your preference profile</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sectors.map((s) => (
            <button key={s} onClick={() => setSector(s)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${sector === s ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
              style={sector === s ? { backgroundColor: B.navy } : {}}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["23", "AI-Matched Deals", "+4 this week", Zap], ["$1.85M", "Committed Capital", "Across 7 deals", DollarSign], ["24.8%", "Avg Portfolio IRR", "+2.1% vs benchmark", TrendingUp], ["9.4/10", "Trust Score", "8 verified reviews", Star]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((d) => <DealCard key={d.id} deal={d} currency={currency} onViewDeal={onViewDeal} />)}
      </div>
    </div>
  );
}

function InvPortfolio({ currency }: { currency: Currency }) {
  const total = MY_INVESTMENTS.reduce((s, i) => s + i.invested, 0);
  const totalVal = MY_INVESTMENTS.reduce((s, i) => s + i.currentVal, 0);
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>My Portfolio</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[[fmt(total, currency), "Total Invested", "5 deals", DollarSign], [fmt(totalVal, currency), "Current Value", "+17.6% overall", TrendingUp], ["24.8%", "Blended IRR", "Across active deals", Activity], ["$380K", "Realized Returns", "1 exit closed", Award]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-semibold mb-1" style={{ color: B.navy }}>Portfolio Value Over Time</div>
          <div className="text-xs text-muted-foreground mb-4">Committed capital (USD 000s)</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={PORTFOLIO_DATA}>
              <defs>
                <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={B.navy} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={B.navy} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: `1px solid ${B.navy}25`, borderRadius: "8px", fontSize: "11px", fontFamily: "JetBrains Mono" }}
                formatter={(v: number) => [fmt(v * 1000, currency), "Committed"]} />
              <Area type="monotone" dataKey="c" stroke={B.navy} strokeWidth={2} fill="url(#navyGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Sector Allocation</div>
          {[["Technology", 35, B.navy], ["Real Estate", 40, B.blue], ["Healthcare", 14, B.teal], ["Energy", 7, B.orange], ["Other", 4, B.mgray]].map(([sec, pct, col]) => (
            <div key={sec as string} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{sec}</span>
                <span className="font-mono font-semibold" style={{ color: B.navy }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col as string }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><span className="text-sm font-semibold" style={{ color: B.navy }}>Investment Holdings</span></div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/30">
            {["Company", "Sector", "Invested", "Current Value", "IRR", "Status", "Date"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {MY_INVESTMENTS.map((inv) => (
              <tr key={inv.deal} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-semibold" style={{ color: B.navy }}>{inv.deal}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.sector}</td>
                <td className="px-4 py-3 font-mono">{fmt(inv.invested, currency)}</td>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: inv.currentVal > inv.invested ? "#059669" : "#DC2626" }}>{fmt(inv.currentVal, currency)}</td>
                <td className="px-4 py-3 font-mono" style={{ color: B.orange }}>{inv.irr}%</td>
                <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{inv.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvMyBids({ currency }: { currency: Currency }) {
  const [tab, setTab] = useState("all");
  const filtered = tab === "hard" ? MY_BIDS.filter((b) => b.type === "Hard Bid") : tab === "soft" ? MY_BIDS.filter((b) => b.type === "Soft Commit") : MY_BIDS;
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>My Bids</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["4", "Active Bids", "Across 4 deals", Gavel], [fmt(1_750_000, currency), "In Escrow", "2 hard bids", Shield], [fmt(1_100_000, currency), "Soft Commits", "2 commitments", FileText], [fmt(380_000, currency), "Realized", "1 successful exit", Award]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="flex gap-2 mb-5">
        {[["all", "All Bids"], ["hard", "Hard Bids"], ["soft", "Soft Commits"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`text-xs font-mono px-4 py-2 rounded-lg border transition-all ${tab === id ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}
            style={tab === id ? { backgroundColor: B.navy } : {}}>
            {label}
          </button>
        ))}
      </div>
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/30">
            {["Deal", "Amount", "Type", "Equity", "Status", "Escrow Ref", "Submitted", "Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-semibold" style={{ color: B.navy }}>{b.deal}</td>
                <td className="px-4 py-3 font-mono font-semibold">{fmt(b.amount, currency)}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{b.type}</td>
                <td className="px-4 py-3 font-mono">{b.equity}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{b.escrow}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{b.submitted}</td>
                <td className="px-4 py-3">
                  <button className="text-xs font-medium" style={{ color: B.orange }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvVDRAccess({ currency }: { currency: Currency }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>VDR Access</h2>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
        All documents you access are dynamically watermarked with your Watermark ID <span className="font-mono font-bold text-foreground">WTC-JP-8841</span>, your IP, and the exact download timestamp.
      </div>
      <div className="space-y-4">
        {VDR_ROOMS.map((room) => (
          <div key={room.deal} className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: B.navy }}>{room.deal}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>NDA signed: {room.ndaDate}</span>
                  <span>· Last accessed: {room.lastAccess}</span>
                  <span>· Watermark: <span className="font-mono">{room.watermarkId}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />Access granted
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.docs.map((doc) => (
                <div key={doc} className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                  <FileText className="w-3.5 h-3.5" style={{ color: B.navy }} />
                  <span className="text-xs font-medium" style={{ color: B.navy }}>{doc}</span>
                  <button><Download className="w-3 h-3" style={{ color: B.orange }} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-5 border border-dashed border-border rounded-xl text-center">
        <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">Sign NDAs to access more data rooms</p>
        <button className="text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ backgroundColor: B.navy }}>Browse Deals →</button>
      </div>
    </div>
  );
}

function InvWallet({ currency }: { currency: Currency }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>Wallet & Funds</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[[fmt(980_000, currency), "Available Balance", "Plaid connected", Wallet], [fmt(1_750_000, currency), "Escrow Holds", "2 active bids", Shield], [fmt(380_000, currency), "Realized Returns", "From exits", TrendingUp], ["USDT 45,000", "Crypto Balance", "WalletConnect", CreditCard]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: B.navy }}>Connected Accounts</span>
            <button className="text-xs font-medium flex items-center gap-1" style={{ color: B.orange }}><Plus className="w-3.5 h-3.5" />Add Account</button>
          </div>
          {[{ name: "Meridian Capital · Chase Business", type: "Fiat · Plaid", bal: fmt(980_000, currency), status: "Connected" }, { name: "MetaMask · 0x8841...E4D2", type: "Web3 · WalletConnect", bal: "USDT 45,000", status: "Connected" }, { name: "Escrow.com · ESC-2024-0041", type: "Escrow Hold", bal: fmt(1_200_000, currency), status: "Active" }, { name: "Escrow.com · ESC-2024-0078", type: "Escrow Hold", bal: fmt(550_000, currency), status: "Active" }].map((a) => (
            <div key={a.name} className="px-5 py-4 border-b border-border last:border-0 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium" style={{ color: B.navy }}>{a.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.type}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-semibold text-xs">{a.bal}</div>
                <StatusBadge status={a.status} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><span className="text-sm font-semibold" style={{ color: B.navy }}>Recent Transactions</span></div>
          {[{ desc: "Escrow hold placed — Nexus AI Bid", date: "Feb 28, 2024", amount: -1_200_000, type: "Escrow" }, { desc: "Escrow hold placed — MediCore Bid", date: "Mar 18, 2024", amount: -550_000, type: "Escrow" }, { desc: "Realized return — TechBridge exit", date: "Aug 14, 2023", amount: +380_000, type: "Return" }, { desc: "Wallet funded — Chase transfer", date: "Jan 5, 2024", amount: +2_000_000, type: "Deposit" }].map((t) => (
            <div key={t.desc} className="px-5 py-4 border-b border-border last:border-0 flex items-center justify-between text-xs">
              <div>
                <div className="font-medium text-foreground">{t.desc}</div>
                <div className="text-muted-foreground mt-0.5 font-mono">{t.date} · {t.type}</div>
              </div>
              <span className={`font-mono font-semibold ${t.amount > 0 ? "text-emerald-600" : "text-foreground"}`}>
                {t.amount > 0 ? "+" : ""}{fmt(Math.abs(t.amount), currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InvProfileKYC() {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>Profile & KYC</h2>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Personal Information</div>
            <div className="grid md:grid-cols-2 gap-4">
              {[["First Name", "James"], ["Last Name", "Pemberton"], ["Email", "james@meridian.capital"], ["Phone", "+44 20 7946 0088"], ["Nationality", "British"], ["Date of Birth", "12 / 03 / 1978"], ["Residential Country", "United Kingdom"], ["WTC Chapter", "WTC London"]].map(([l, v]) => (
                <div key={l}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{l}</label>
                  <input defaultValue={v} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
                </div>
              ))}
            </div>
            <button className="mt-4 px-5 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: B.navy }}>Save Changes</button>
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Investment Preferences</div>
            <div className="grid md:grid-cols-2 gap-4">
              {[["Preferred Sectors", "Technology, Healthcare, FinTech"], ["Preferred Geographies", "MENA, Europe, Asia-Pacific"], ["Typical Check Size", "$250K – $2M"], ["Stage Focus", "Series A, Series B"], ["Min Target IRR", "20%+"], ["Investment Horizon", "5–7 years"]].map(([l, v]) => (
                <div key={l}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{l}</label>
                  <input defaultValue={v} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Verification Status</div>
            {[["Identity KYC", true, "Persona verified · Jan 2024"], ["Accreditation", true, "Qualified purchaser · Valid until Jan 2025"], ["AML Screening", true, "Cleared · Updated Apr 2024"], ["WTC Membership", true, "WTC London · Member #8841"], ["Wallet Link", false, "Connect a wallet to continue"], ["MFA Enabled", true, "TOTP authenticator active"]].map(([l, ok, note]) => (
              <div key={l as string} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ok ? "bg-emerald-100" : "bg-amber-100"}`}>
                  {ok ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                </div>
                <div>
                  <div className="text-xs font-medium" style={{ color: B.navy }}>{l}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{note}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-3" style={{ color: B.navy }}>Trust Score</div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl font-mono font-bold" style={{ color: B.navy }}>9.4</div>
              <div className="text-muted-foreground text-xs">/ 10 · Based on 8 KYC-verified reviews</div>
            </div>
            <div className="h-2 bg-secondary rounded-full">
              <div className="h-full rounded-full" style={{ width: "94%", backgroundColor: B.teal }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvSettings() {
  const [notifs, setNotifs] = useState({ deals: true, bids: true, vdr: true, newsletter: false });
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>Settings</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Notification Preferences</div>
            {([["deals", "New AI-matched deals"], ["bids", "Bid status updates"], ["vdr", "VDR access alerts"], ["newsletter", "Weekly deal digest"]] as [keyof typeof notifs, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{label}</span>
                <button onClick={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))}
                  className="flex items-center gap-1.5 text-xs font-mono transition-colors"
                  style={{ color: notifs[key] ? B.teal : B.mgray }}>
                  {notifs[key] ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {notifs[key] ? "On" : "Off"}
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Display Preferences</div>
            {[["Default Currency", "USD"], ["Platform Language", "English (UK)"], ["Timezone", "GMT+0 · London"]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{l}</span>
                <span className="text-sm font-medium" style={{ color: B.navy }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Security</div>
            {[["Two-Factor Authentication", "TOTP Enabled · Authenticator app", true], ["Session Management", "2 active sessions", false], ["Password", "Last changed 45 days ago", false]].map(([l, v, ok]) => (
              <div key={l as string} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium" style={{ color: B.navy }}>{l}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{v}</div>
                </div>
                <button className="text-xs font-medium" style={{ color: B.orange }}>
                  {ok ? "Manage" : "Update"}
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Account</div>
            {["Export My Data", "Close Account"].map((action) => (
              <div key={action} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{action}</span>
                <button className="text-xs font-medium" style={{ color: action === "Close Account" ? "#DC2626" : B.orange }}>{action === "Close Account" ? "Danger →" : "Request →"}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INVESTOR DASHBOARD SHELL ─────────────────────────────────────────────────

function InvestorDashboard({ setView, onViewDeal }: { setView: (v: View) => void; onViewDeal: (d: Deal) => void }) {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [tab, setTab] = useState("deal-flow");
  const navItems: NavItem[] = [
    { id: "deal-flow", label: "Deal Flow", icon: TrendingUp },
    { id: "portfolio", label: "Portfolio", icon: BarChart2 },
    { id: "bids", label: "My Bids", icon: Gavel },
    { id: "vdr", label: "VDR Access", icon: Lock },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "kyc", label: "Profile & KYC", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const titles: Record<string, string> = { "deal-flow": "Deal Flow", portfolio: "Portfolio", bids: "My Bids", vdr: "VDR Access", wallet: "Wallet", kyc: "Profile & KYC", settings: "Settings" };
  return (
    <div className="flex h-screen bg-secondary/30 overflow-hidden">
      <Sidebar items={navItems} active={tab} setActive={setTab} onBack={() => setView("home")} userInitials="JP" userName="James Pemberton" userRole="Accredited Investor" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopBar title={titles[tab] || "Dashboard"} currency={currency} setCurrency={setCurrency} />
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "deal-flow" && <InvDealFlow currency={currency} onViewDeal={onViewDeal} />}
          {tab === "portfolio" && <InvPortfolio currency={currency} />}
          {tab === "bids" && <InvMyBids currency={currency} />}
          {tab === "vdr" && <InvVDRAccess currency={currency} />}
          {tab === "wallet" && <InvWallet currency={currency} />}
          {tab === "kyc" && <InvProfileKYC />}
          {tab === "settings" && <InvSettings />}
        </main>
      </div>
    </div>
  );
}

// ─── FOUNDER DASHBOARD PAGES ──────────────────────────────────────────────────

function FndOverview({ currency }: { currency: Currency }) {
  const project = DEALS[0];
  const pct = Math.round((project.committed / project.target) * 100);
  const milestones = ["WTC Chapter Verified", "Subscription Activated", "VDR Published", "First Investor NDA", "Term Sheets Received", "Escrow Holds Active", "Round Closed", "Funds Disbursed"];
  return (
    <div>
      <div className="bg-white border border-border rounded-xl p-5 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold text-white" style={{ backgroundColor: project.bg }}>{project.initials}</div>
            <div>
              <div className="font-bold text-base" style={{ color: B.navy }}>{project.name}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{project.stage} · {project.sector} · {project.wtcChapter}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Active Listing", "VDR Live", "Professional Plan"].map((badge, i) => (
                  <span key={badge} className="text-xs font-mono px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: [B.teal, B.navy, B.orange][i] }}>{badge}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <div className="text-2xl font-mono font-bold" style={{ color: B.navy }}>{fmt(project.committed, currency)}</div>
            <div className="text-xs text-muted-foreground">of {fmt(project.target, currency)} target</div>
            <div className="w-40 h-2 bg-secondary rounded-full mt-2 md:ml-auto">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: B.navy }} />
            </div>
            <div className="text-xs font-mono font-semibold mt-1" style={{ color: B.orange }}>{pct}% raised</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["184", "Investor Views", "+12 this week", Eye], ["23", "NDAs Signed", "3 new today", FileText], ["4", "Active Bids", fmt(2_750_000, currency) + " total", Gavel], [fmt(project.committed, currency), "Committed", `${pct}% of target`, DollarSign]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: B.navy }}>VDR Access Log</span>
            <span className="text-xs font-mono text-muted-foreground">Watermarked · Identity-tracked</span>
          </div>
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border bg-secondary/30">
                {["Investor / Firm", "Documents", "Status", "Time"].map((h) => <th key={h} className="text-left px-4 py-3 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>)}
              </tr></thead>
              <tbody>
                {VDR_ACCESS_LOG.map((row) => (
                  <tr key={row.investor} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: B.navy }}>{row.investor}</div>
                      <div className="text-muted-foreground">{row.firm} · {row.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">{row.docs.map((d) => <span key={d} className="border border-border text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">{d}</span>)}</div>
                    </td>
                    <td className="px-4 py-3">{row.verified ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />KYC</span> : <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" />Pending</span>}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: B.navy }}>Bid Pipeline</span>
              <span className="text-xs font-mono font-bold" style={{ color: B.orange }}>{fmt(2_750_000, currency)} total</span>
            </div>
            <div className="space-y-2.5">
              {FOUNDER_BIDS.map((b) => (
                <div key={b.id} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: B.navy }}>{b.investor}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{b.type} · {b.equity} equity · {b.submitted}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold" style={{ color: B.navy }}>{fmt(b.amount, currency)}</div>
                      <div className="mt-1"><StatusBadge status={b.status} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <div className="text-sm font-semibold mb-3" style={{ color: B.navy }}>Deal Milestones</div>
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={m} className="flex items-center gap-3 text-xs">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < 6 ? "bg-emerald-100" : "border border-border"}`}>
                    {i < 6 && <Check className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <span className={i < 6 ? "" : "text-muted-foreground"} style={i < 6 ? { color: B.navy } : {}}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FndVDRManager({ currency }: { currency: Currency }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>VDR Manager</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["6", "Documents", "In active VDR", FileText], ["23", "NDA Signers", "Investors granted access", Users], ["184", "Views This Month", "+12 this week", Eye], ["0", "Unauthorized Shares", "Watermark integrity", Shield]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: B.navy }}>Published Documents</span>
          <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: B.orange }}>
            <Upload className="w-3.5 h-3.5" />Upload Document
          </button>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/30">
            {["Document", "Category", "Uploaded", "Downloads", "Watermarks", "Access"].map((h) => <th key={h} className="text-left px-4 py-3 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>)}
          </tr></thead>
          <tbody>
            {[["Pitch Deck v4.pdf", "Marketing", "Apr 1, 2024", 18, 18, "All NDA signers"], ["Financial Model FY24.xlsx", "Financial", "Mar 15, 2024", 12, 12, "All NDA signers"], ["Cap Table.pdf", "Legal", "Feb 20, 2024", 8, 8, "Tier 2 investors only"], ["Term Sheet Template.docx", "Legal", "Mar 1, 2024", 5, 5, "All NDA signers"], ["Business Plan 2024.pdf", "Strategy", "Jan 10, 2024", 22, 22, "All NDA signers"], ["Audited Accounts 2023.pdf", "Financial", "Feb 5, 2024", 9, 9, "Tier 2 investors only"]].map(([name, cat, date, dl, wm, access]) => (
              <tr key={name as string} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="w-3.5 h-3.5" style={{ color: B.navy }} /><span className="font-medium" style={{ color: B.navy }}>{name}</span></div></td>
                <td className="px-4 py-3 text-muted-foreground">{cat}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{date}</td>
                <td className="px-4 py-3 font-mono">{dl}</td>
                <td className="px-4 py-3 font-mono">{wm}</td>
                <td className="px-4 py-3 text-muted-foreground">{access}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FndBidPipeline({ currency }: { currency: Currency }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>Bid Pipeline</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["4", "Active Bids", "Across 4 investors", Gavel], [fmt(2_000_000, currency), "Escrow-Backed", "2 hard bids", Shield], [fmt(750_000, currency), "Soft Commits", "2 commitments", FileText], ["61%", "Round Progress", fmt(9_200_000, currency) + " committed", TrendingUp]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><span className="text-sm font-semibold" style={{ color: B.navy }}>All Bids</span></div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/30">
            {["Investor", "Amount", "Type", "Equity Ask", "Status", "Submitted", "Action"].map((h) => <th key={h} className="text-left px-4 py-3 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>)}
          </tr></thead>
          <tbody>
            {FOUNDER_BIDS.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-semibold" style={{ color: B.navy }}>{b.investor}</td>
                <td className="px-4 py-3 font-mono font-semibold">{fmt(b.amount, currency)}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.type}</td>
                <td className="px-4 py-3 font-mono">{b.equity}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{b.submitted}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-xs font-medium" style={{ color: B.teal }}>Accept</button>
                  <button className="text-xs font-medium" style={{ color: B.orange }}>Counter</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FndNDAManager() {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>NDA Manager</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["23", "NDAs Signed", "All active", CheckCircle2], ["3", "Pending Review", "Awaiting execution", Clock], ["0", "Revoked", "No revocations", Shield], ["18", "VDR Accesses", "Post-NDA views", Eye]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: B.navy }}>NDA Log</span>
          <span className="text-xs font-mono text-muted-foreground">Dynamic NDAs — auto-executed on investor signature</span>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/30">
            {["Investor", "Firm", "Signed Date", "Expiry", "Status", "Action"].map((h) => <th key={h} className="text-left px-4 py-3 font-mono text-muted-foreground uppercase tracking-wider font-normal">{h}</th>)}
          </tr></thead>
          <tbody>
            {[...VDR_ACCESS_LOG, { investor: "Thomas Adler", firm: "Alpine Capital", location: "Zurich, CH", time: "1 week ago", docs: [], verified: true }, { investor: "Mei Lin Zhang", firm: "Horizon PE", location: "Beijing, CN", time: "2 weeks ago", docs: [], verified: true }].slice(0, 6).map((row, i) => (
              <tr key={row.investor} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 font-semibold" style={{ color: B.navy }}>{row.investor}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.firm}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{["Apr 2, 2024", "Apr 1, 2024", "Mar 22, 2024", "Mar 18, 2024", "Mar 10, 2024", "Feb 28, 2024"][i]}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{["Apr 2, 2025", "Apr 1, 2025", "Mar 22, 2025", "Mar 18, 2025", "Mar 10, 2025", "Feb 28, 2025"][i]}</td>
                <td className="px-4 py-3">{row.verified ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Executed</span> : <span className="flex items-center gap-1 text-amber-600"><Clock className="w-3 h-3" />Pending</span>}</td>
                <td className="px-4 py-3"><button className="text-xs font-medium" style={{ color: B.orange }}>Revoke</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FndEscrow({ currency }: { currency: Currency }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>Escrow</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[[fmt(2_000_000, currency), "Funds in Escrow", "2 hard bids", Shield], [fmt(12_200_000, currency), "Total Committed", "61% of target", DollarSign], ["0", "Disbursements", "Pre-close", CheckCircle2], ["Apr 30", "Target Close", "Estimated close date", Clock]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Active Escrow Holds</div>
          {[{ ref: "ESC-2024-0041", investor: "Meridian Capital", amount: 1_200_000, provider: "Qualified.com", status: "Active Hold", released: "On close" }, { ref: "ESC-2024-0078", investor: "Gulf Ventures", amount: 800_000, provider: "Escrow.com", status: "Active Hold", released: "On close" }].map((e) => (
            <div key={e.ref} className="p-4 border border-border rounded-xl mb-3 last:mb-0">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-xs" style={{ color: B.navy }}>{e.ref}</span>
                <StatusBadge status={e.status} />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="font-semibold text-sm" style={{ color: B.navy }}>{fmt(e.amount, currency)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{e.investor} · {e.provider}</div>
                </div>
                <div className="text-xs text-muted-foreground">Release: {e.released}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Milestone-Based Disbursement</div>
          {[["Seed documentation complete", true], ["Due diligence approved", true], ["Term sheets countersigned", true], ["Regulatory filings submitted", false], ["Final close — wires authorized", false], ["Funds disbursed to company", false]].map(([m, done]) => (
            <div key={m as string} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 text-xs">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-100" : "border border-border"}`}>
                {done && <Check className="w-3 h-3 text-emerald-600" />}
              </div>
              <span className={done ? "" : "text-muted-foreground"} style={done ? { color: B.navy } : {}}>{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FndAnalytics({ currency }: { currency: Currency }) {
  const barData = [{ m: "Jan", v: 12 }, { m: "Feb", v: 28 }, { m: "Mar", v: 45 }, { m: "Apr", v: 62 }, { m: "May", v: 84 }, { m: "Jun", v: 110 }, { m: "Jul", v: 148 }, { m: "Aug", v: 184 }];
  return (
    <div>
      <h2 className="text-lg font-bold mb-6" style={{ color: B.navy }}>Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[["184", "Total VDR Views", "+12 this week", Eye], ["23", "NDAs Signed", "18.8% conversion", FileText], ["61%", "Round Progress", fmt(9_200_000, currency) + " raised", TrendingUp], ["94", "Match Score Avg", "Top 8% of listings", Zap]].map(([v, l, d, Icon]) => (
          <KPICard key={l as string} label={l as string} value={v as string} delta={d as string} up Icon={Icon as React.ElementType} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-semibold mb-1" style={{ color: B.navy }}>Investor Views Over Time</div>
          <div className="text-xs text-muted-foreground mb-4">Monthly VDR access count</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#6B7280", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: `1px solid ${B.navy}25`, borderRadius: "8px", fontSize: "11px", fontFamily: "JetBrains Mono" }}
                formatter={(v: number) => [v, "Views"]} />
              <Bar dataKey="v" fill={B.navy} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-semibold mb-4" style={{ color: B.navy }}>Investor Geography</div>
          {[["Middle East", 38, B.orange], ["Europe", 32, B.navy], ["Asia Pacific", 18, B.teal], ["Americas", 9, B.blue], ["Africa", 3, B.yellow]].map(([region, pct, col]) => (
            <div key={region as string} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{region}</span>
                <span className="font-mono font-semibold" style={{ color: B.navy }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col as string }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FOUNDER DASHBOARD SHELL ──────────────────────────────────────────────────

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
    { id: "settings", label: "Settings", icon: Settings },
  ];
  const titles: Record<string, string> = { overview: "Overview", vdr: "VDR Manager", bids: "Bid Pipeline", nda: "NDA Manager", escrow: "Escrow", analytics: "Analytics", settings: "Settings" };
  return (
    <div className="flex h-screen bg-secondary/30 overflow-hidden">
      <Sidebar items={navItems} active={tab} setActive={setTab} onBack={() => setView("home")} userInitials="AK" userName="Amira Khalil" userRole="Founder · Nexus AI" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashTopBar title={titles[tab] || "Founder Portal"} currency={currency} setCurrency={setCurrency} badge="Professional Plan" />
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "overview" && <FndOverview currency={currency} />}
          {tab === "vdr" && <FndVDRManager currency={currency} />}
          {tab === "bids" && <FndBidPipeline currency={currency} />}
          {tab === "nda" && <FndNDAManager />}
          {tab === "escrow" && <FndEscrow currency={currency} />}
          {tab === "analytics" && <FndAnalytics currency={currency} />}
          {tab === "settings" && <InvSettings />}
        </main>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const routeViews: Record<string, View> = {
    "/": "home", "/marketplace": "deals", "/about": "about", "/sign-in": "login",
    "/join": "register", "/post-deal": "list-project", "/how-it-works": "platform", "/trade-network": "chapters",
  };
  const viewRoutes: Partial<Record<View, string>> = Object.fromEntries(Object.entries(routeViews).map(([path, routeView]) => [routeView, path]));
  const [view, setView] = useState<View>(() => routeViews[window.location.pathname] || "home");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [prevView, setPrevView] = useState<View>("home");

  useEffect(() => {
    const syncRoute = () => setView(routeViews[window.location.pathname] || "home");
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  function navigateTo(v: View) {
    setPrevView(view);
    setView(v);
    const path = viewRoutes[v];
    if (path && window.location.pathname !== path) window.history.pushState({}, "", path);
  }

  function handleViewDeal(deal: Deal) {
    setSelectedDeal(deal);
    setPrevView(view);
    setView("project-detail");
    window.history.pushState({}, "", `/marketplace/${deal.id}`);
  }

  function handleBack() {
    navigateTo(prevView === "project-detail" ? "deals" : prevView);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {view === "home" && <HomePage setView={navigateTo} onViewDeal={handleViewDeal} />}
      {view === "platform" && <PlatformPage setView={navigateTo} />}
      {view === "deals" && <DealsPage setView={navigateTo} onViewDeal={handleViewDeal} />}
      {view === "chapters" && <ChaptersPage setView={navigateTo} />}
      {view === "about" && <AboutPage setView={navigateTo} />}
      {view === "login" && <LoginPage setView={navigateTo} />}
      {view === "register" && <RegisterPage setView={navigateTo} />}
      {view === "list-project" && <ListProjectPage setView={navigateTo} />}
      {view === "project-detail" && selectedDeal && (
        <ProjectDetailPage deal={selectedDeal} setView={navigateTo} onBack={handleBack} currency="USD" />
      )}
      {view === "investor" && <InvestorDashboard setView={navigateTo} onViewDeal={handleViewDeal} />}
      {view === "founder" && <FounderDashboard setView={navigateTo} />}
    </div>
  );
}
