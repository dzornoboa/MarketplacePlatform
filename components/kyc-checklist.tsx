import Link from 'next/link'
import type { KycStep } from '@/lib/kyc'

/* The before-you-pay / before-verification checklist. */
export function KycChecklist({ steps, title, intro }: { steps: KycStep[]; title: string; intro: string }) {
  const left = steps.filter(s => !s.done).length
  return <section className="card kyc-card" id="kyc">
    <h2>{title}</h2>
    <p className="muted">{intro}{left > 0 ? ` ${left} item${left === 1 ? '' : 's'} outstanding.` : ' Everything is in place.'}</p>
    <ol className="checklist">{steps.map(step => <li key={step.key} className={step.done ? 'checklist-done' : ''}>
      <span aria-hidden="true">{step.done ? '✓' : '○'}</span>
      <Link href={step.href}>{step.label}</Link>
      <em>{step.done ? 'Done' : 'Required'}</em>
    </li>)}</ol>
  </section>
}
