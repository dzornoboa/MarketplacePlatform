import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { RegisterFields } from '@/components/register-fields'
import { signup } from '../actions'
import { BrandCircle, Logo, LogoLink } from '@/components/brand'
import { getPageBlock, getPublicPlans } from '@/lib/content/site-content'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams
  const error = typeof params.error === 'string' ? params.error : null
  const planCode = typeof params.plan === 'string' ? params.plan : ''
  const typeParam = typeof params.type === 'string' ? params.type : ''
  const plans = await getPublicPlans()
  const chosen = plans.find(pl => pl.code === planCode) ?? null
  const aside = await getPageBlock('auth', 'register_aside', { eyebrow: 'Verification first', heading: 'A trusted network,', heading_emphasis: 'not an open deal directory', body: 'WTC Accra reviews participant information before unlocking private opportunities and member privileges.', cta_label: null, cta_href: null, secondary_cta_label: null, secondary_cta_href: null, image_url: null })

  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-wide">
        <LogoLink />
        <p className="eyebrow">Join the platform</p>
        <h1>Create your account</h1>
        <p className="muted">{chosen ? `You are signing up for the ${chosen.name} plan. ` : ''}After confirming your email you {chosen && Number(chosen.price_usd) === 0 ? 'can browse the marketplace straight away' : 'pay for your plan to activate your account and open the marketplace'}.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form action={signup} className="form-stack">
          <RegisterFields plans={plans} initialPlan={chosen?.code ?? ''} initialType={chosen?.target_participant_types.includes(typeParam) ? typeParam : (chosen?.target_participant_types[0] ?? typeParam)} />
          <SubmitButton>Create account</SubmitButton>
        </form>
        <div className="auth-links"><span>Already registered?</span><Link href="/login">Sign in</Link></div>
      </section>
      <aside className="auth-aside" data-section="register_aside">
        <BrandCircle className="motif motif-aside" stroke={2} />
        <Logo variant="white" />
        {aside.eyebrow && <p className="eyebrow light">{aside.eyebrow}</p>}
        <h2>{aside.heading} {aside.heading_emphasis && <strong>{aside.heading_emphasis}</strong>}</h2>
        {aside.body && <p>{aside.body}</p>}
        <p className="quote">Connecting Businesses, Globally.</p>
      </aside>
    </main>
  )
}
