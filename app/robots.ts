import type { MetadataRoute } from 'next'
import { getSiteUrl } from '@/lib/supabase/config'

/* /robots.txt answered 404, so search engines had no instruction at all and
   nothing kept them out of the signed-in areas. */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl()
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/admin/', '/editor/', '/api/', '/auth/', '/oauth/', '/set-password', '/reset-password', '/verify-email', '/resume-registration'],
    }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  }
}
