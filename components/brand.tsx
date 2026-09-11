import Link from 'next/link'

/* WTCA brand circle. Four arcs — navy, gold, orange, teal — reproduced from
   "Large Circle 4 Colors". The circle represents the connections the network
   facilitates, so it is used as the platform's recurring decorative motif. */
const ARCS = [
  { color: 'var(--wtc-orange)', rotate: 2 },
  { color: 'var(--wtc-teal)', rotate: 92 },
  { color: 'var(--wtc-navy)', rotate: 182 },
  { color: 'var(--wtc-gold)', rotate: 272 },
]

type CircleProps = { className?: string; stroke?: number }

export function BrandCircle({ className, stroke = 3 }: CircleProps) {
  return <svg className={`brand-circle ${className ?? ''}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false">{ARCS.map(arc => <circle key={arc.rotate} cx="50" cy="50" r="46" fill="none" stroke={arc.color} strokeWidth={stroke} strokeDasharray="68 221" transform={`rotate(${arc.rotate} 50 50)`} />)}</svg>
}

/* Single arc, for corner accents on cards and panels. */
export function BrandArc({ color = 'var(--wtc-orange)', className, stroke = 3 }: { color?: string } & CircleProps) {
  return <svg className={`brand-arc ${className ?? ''}`} viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth={stroke} strokeDasharray="150 139" transform="rotate(140 50 50)" /></svg>
}

/* The approved WTC Accra member logo. Never recoloured, never on imagery. */
export function Logo({ variant = 'black', className }: { variant?: 'black' | 'white'; className?: string }) {
  return <img className={`logo ${className ?? ''}`} src={`/brand/wtc-accra-logo-${variant}.png`} alt="World Trade Centre Accra" width={2048} height={283} />
}

export function LogoLink({ href = '/', variant = 'black', className }: { href?: string; variant?: 'black' | 'white'; className?: string }) {
  return <Link className={`logo-link ${className ?? ''}`} href={href}><Logo variant={variant} /></Link>
}

/* "A Member of World Trade Centers Association — Connecting Businesses, Globally." */
export function MemberMark({ className }: { className?: string }) {
  return <img className={`member-mark ${className ?? ''}`} src="/brand/member-of-wtca-black.png" alt="A member of World Trade Centers Association — Connecting Businesses, Globally." width={8088} height={2000} />
}
