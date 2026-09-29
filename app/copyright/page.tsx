import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

export const metadata = {
  title: 'Copyright And DMCA Policy',
  description: 'Copyright notice and takedown process for content on the WTC Accra Hub.',
}

export default function CopyrightPage() {
  return <><PublicHeader /><main><section className="section"><article className="article-page">
    <p className="eyebrow">Legal And Content</p>
    <h1 className="article-title">Copyright And DMCA Policy</h1>
    <p className="field-help">Last Updated: 29 September 2026</p>
    <div className="prose">
      <p>World Trade Centre Accra respects intellectual property rights and expects members and other users of the WTC Accra Hub to do the same. Users must only upload or publish material they own, are authorised to use, or are otherwise legally entitled to provide.</p>

      <h2>Reporting Copyright Infringement</h2>
      <p>If you believe material available through the platform infringes your copyright, send a written notice that identifies the copyrighted work, identifies the allegedly infringing material and where it appears, provides your contact information, includes a statement of your good-faith belief that the disputed use is not authorised, includes a statement under penalty of perjury that the information in the notice is accurate and that you are authorised to act for the copyright owner, and includes your physical or electronic signature.</p>

      <h2>Where To Send A Notice</h2>
      <p>Copyright notices may be sent to: Copyright Agent, World Trade Centre Accra, 22 Independence Avenue, Accra, Ghana. Email: legal@wtcaccra.com. If that mailbox is unavailable, use membership@wtcaccra.com and clearly mark the subject “Copyright Notice”.</p>

      <h2>Counter-Notification</h2>
      <p>If content you supplied is removed or disabled because of a copyright notice and you believe that happened because of mistake or misidentification, you may submit a counter-notification that identifies the removed material and its former location, states under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification, provides your name, address and telephone number, includes the jurisdictional consent required by applicable U.S. law where the DMCA process applies, and includes your physical or electronic signature.</p>

      <h2>Repeat Infringement</h2>
      <p>Where appropriate and in suitable circumstances, WTC Accra may restrict or terminate access for users who repeatedly infringe copyright or materially abuse the platform's content systems.</p>

      <h2>United States DMCA Agent Registration</h2>
      <p>Publishing this page does not itself register a designated agent with the U.S. Copyright Office. If WTC Accra intends to rely on the U.S. DMCA safe-harbour framework for eligible user-generated content, an authorised representative should separately register and maintain the designated agent through the U.S. Copyright Office's online DMCA Designated Agent Directory, keep the public contact details consistent with that registration, and renew or update the designation as required.</p>

      <h2>Other Intellectual Property</h2>
      <p>World Trade Center and related marks, logos, brand assets and other protected materials are owned by their respective rights holders and may be used only as authorised. Nothing on the platform grants a licence to use those marks outside the platform or beyond the scope of an applicable agreement.</p>

      <h2>Contact</h2>
      <p>For questions about this policy, contact World Trade Centre Accra at legal@wtcaccra.com or membership@wtcaccra.com.</p>
    </div>
  </article></section></main><PublicFooter /></>
}
