/* Small dependency-free SVG charts for the console. Server-rendered, so
   they cost nothing on the client and print cleanly. */

const NAVY = '#123B6D', ORANGE = '#E85D0C', TEAL = '#2A9D8F', GOLD = '#E5C056', SKY = '#8FB8DE', MUTED = '#8A94A6'
export const PALETTE = [NAVY, ORANGE, TEAL, GOLD, SKY, '#B56576', '#6D597A']
const fmtValue = (v: number, money: boolean) => money ? `US$${v.toLocaleString()}` : v.toLocaleString()

export function BarChart({ data, height = 160, money = false, title }: { data: Array<{ label: string; value: number; color?: string }>; height?: number; money?: boolean; title?: string }) {
  const max = Math.max(1, ...data.map(d => d.value))
  const w = 100 / Math.max(1, data.length)
  const H = height / 2
  return <figure className="chart">
    {title && <figcaption>{title}</figcaption>}
    <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-label={title ?? 'Bar chart'}>
      {data.map((d, i) => {
        const h = (d.value / max) * (H - 6)
        return <rect key={d.label} x={i * w + w * 0.15} y={H - 2 - h} width={w * 0.7} height={h} rx="0.6" fill={d.color ?? PALETTE[i % PALETTE.length]} aria-label={`${d.label}: ${fmtValue(d.value, money)}`} />
      })}
    </svg>
    <div className="chart-labels">{data.map(d => <span key={d.label}><strong>{fmtValue(d.value, money)}</strong>{d.label}</span>)}</div>
  </figure>
}

export function LineChart({ series, labels, height = 150, money = false, title }: { series: Array<{ name: string; values: number[]; color?: string }>; labels: string[]; height?: number; money?: boolean; title?: string }) {
  const max = Math.max(1, ...series.flatMap(s => s.values))
  const n = Math.max(2, labels.length)
  const H = height / 2
  const x = (i: number) => 4 + (i / (n - 1)) * 92
  const y = (v: number) => 4 + (1 - v / max) * (H - 8)
  return <figure className="chart">
    {title && <figcaption>{title}</figcaption>}
    <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" role="img" aria-label={title ?? 'Line chart'}>
      {[0.25, 0.5, 0.75, 1].map(f => <line key={f} x1="4" x2="96" y1={y(max * f)} y2={y(max * f)} stroke="#e6e9ef" strokeWidth="0.3" />)}
      {series.map((s, si) => {
        const color = s.color ?? PALETTE[si % PALETTE.length]
        const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
        return <g key={s.name}>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="1.1" fill={color} aria-label={`${s.name} · ${labels[i]}: ${fmtValue(v, money)}`} />)}
        </g>
      })}
    </svg>
    <div className="chart-labels chart-labels-line">{labels.map(l => <span key={l}>{l}</span>)}</div>
    <div className="chart-legend">{series.map((s, i) => <span key={s.name}><i style={{ background: s.color ?? PALETTE[i % PALETTE.length] }} />{s.name}</span>)}</div>
  </figure>
}

export function Donut({ data, title, size = 120 }: { data: Array<{ label: string; value: number; color?: string }>; title?: string; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const denom = Math.max(1, total)
  let acc = 0
  const r = 15.9155
  return <figure className="chart chart-donut">
    {title && <figcaption>{title}</figcaption>}
    <div className="donut-row">
      <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={title ?? 'Donut chart'}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="#eef1f5" strokeWidth="6" />
        {data.map((d, i) => {
          const pct = (d.value / denom) * 100
          const offset = 25 - acc
          acc += pct
          return <circle key={d.label} cx="21" cy="21" r={r} fill="none" stroke={d.color ?? PALETTE[i % PALETTE.length]} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} aria-label={`${d.label}: ${d.value}`} />
        })}
        <text x="21" y="23" textAnchor="middle" fontSize="7" fontWeight="700" fill={NAVY}>{total}</text>
      </svg>
      <div className="chart-legend chart-legend-col">{data.map((d, i) => <span key={d.label}><i style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />{d.label} <strong>{d.value}</strong></span>)}</div>
    </div>
  </figure>
}

export function Funnel({ steps, title }: { steps: Array<{ label: string; value: number }>; title?: string }) {
  const max = Math.max(1, ...steps.map(s => s.value))
  return <figure className="chart">
    {title && <figcaption>{title}</figcaption>}
    <div className="funnel">{steps.map((s, i) => <div key={s.label} className="funnel-step">
      <span className="funnel-label">{s.label}</span>
      <div className="funnel-bar"><div style={{ width: `${Math.max(4, (s.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }} /></div>
      <strong>{s.value}</strong>
      <small>{i > 0 && steps[i - 1].value > 0 ? `${Math.round((s.value / steps[i - 1].value) * 100)}%` : ''}</small>
    </div>)}</div>
  </figure>
}

export const chartColors = { NAVY, ORANGE, TEAL, GOLD, SKY, MUTED }
