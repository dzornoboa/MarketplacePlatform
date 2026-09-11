import { notFound } from 'next/navigation'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import { PageSections } from '@/components/page-sections'
import { getPageContent, getPublicPlans, getSiteChrome } from '@/lib/content/site-content'

/* Every standalone marketing page is the same shell: chrome, then whatever
   sections the editor has published for that slug. */
export async function PublicPage({ slug }: { slug: string }) {
  const [page, chrome] = await Promise.all([getPageContent(slug), getSiteChrome()])
  if (page.sections.length === 0) notFound()
  const needsPlans = page.sections.some(section => section.layout === 'plans')
  const plans = needsPlans ? await getPublicPlans() : []

  return <><PublicHeader /><main>
    <PageSections sections={page.sections} plans={plans} settings={chrome.settings} />
  </main><PublicFooter /></>
}
