import Link from 'next/link'
import type { Metadata } from 'next'
import { BackButton } from '@/components/BackButton'

export const metadata: Metadata = {
  title: 'Privacy Policy — ShipReady',
  description: 'How ShipReady collects, uses, and protects your data.',
}

const UPDATED = 'April 5, 2025'
const EMAIL   = 'hi@shipready.app'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* nav */}
      <nav className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <BackButton />
          <span className="text-xs text-[#5A5955]">Last updated: {UPDATED}</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-medium mb-2">Privacy Policy</h1>
        <p className="text-[#8B8A85] mb-12 text-sm">Effective date: {UPDATED}</p>

        <div className="prose-custom space-y-10 text-[#8B8A85] text-sm leading-relaxed">

          <Section title="1. Who we are">
            ShipReady is a web quality audit tool built and operated by Eugene Gusakov.
            You can reach us at <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.
          </Section>

          <Section title="2. What data we collect">
            <p>We collect only what is necessary to provide the service:</p>
            <ul>
              <li><strong className="text-[#F1F0EE]">URLs you submit</strong> — to run the audit. We do not crawl or store the content of your pages beyond what is needed to generate the report.</li>
              <li><strong className="text-[#F1F0EE]">Account data</strong> — if you sign up: your email address, provided via Supabase Auth (supports magic link and OAuth).</li>
              <li><strong className="text-[#F1F0EE]">Payment data</strong> — processed by the selected payment provider after paid launch. We never see or store your card details.</li>
              <li><strong className="text-[#F1F0EE]">Usage data</strong> — scan history linked to your account (URL, scores, timestamp).</li>
              <li><strong className="text-[#F1F0EE]">Technical data</strong> — standard server logs (IP address, browser, timestamps) retained for up to 30 days.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul>
              <li>To run scans and generate reports for you.</li>
              <li>To manage your account and subscription.</li>
              <li>To send transactional emails (scan complete, billing receipts). We do not send marketing emails without your consent.</li>
              <li>To detect abuse and protect the service.</li>
            </ul>
            We do not sell your data. We do not use it for advertising.
          </Section>

          <Section title="4. Third-party services">
            <ul>
              <li><strong className="text-[#F1F0EE]">Supabase</strong> — database and authentication (EU region). <a href="https://supabase.com/privacy" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">Privacy policy</a>.</li>
              <li><strong className="text-[#F1F0EE]">Payment provider</strong> — to be selected before paid launch.</li>
              <li><strong className="text-[#F1F0EE]">Vercel</strong> — hosting and edge functions. <a href="https://vercel.com/legal/privacy-policy" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">Privacy policy</a>.</li>
              <li><strong className="text-[#F1F0EE]">OpenAI</strong> — AI-generated report enrichment and fix prompts. URLs and issue data are sent to generate prompts. <a href="https://openai.com/policies/privacy-policy/" className="text-[#6E56CF] hover:underline" target="_blank" rel="noopener noreferrer">Privacy policy</a>.</li>
            </ul>
          </Section>

          <Section title="5. Cookies">
            We use only essential cookies required for session management and authentication.
            We do not use tracking or advertising cookies.
          </Section>

          <Section title="6. Data retention">
            <ul>
              <li>Scan results are retained as long as your account is active.</li>
              <li>Anonymous scans (no account) may be deleted after 30 days.</li>
              <li>You can request deletion of your data at any time by emailing us.</li>
            </ul>
          </Section>

          <Section title="6a. Report visibility">
            Anonymous reports are accessible to anyone who has the report URL.
            Reports linked to a signed-in account are private to that account unless we add an explicit sharing feature in the future.
            If you do not want a report to be accessible by URL, run the scan from a signed-in account.
          </Section>

          <Section title="7. Your rights (GDPR)">
            If you are in the European Economic Area, you have the right to:
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data (&quot;right to be forgotten&quot;).</li>
              <li>Object to or restrict processing.</li>
              <li>Data portability.</li>
            </ul>
            To exercise any of these rights, email <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.
          </Section>

          <Section title="8. Security">
            All data is transmitted over HTTPS. Database access is protected by row-level security (Supabase RLS).
            We do not store passwords — authentication is handled via magic links and OAuth.
          </Section>

          <Section title="9. Changes to this policy">
            We may update this policy. We will notify you by posting the new policy on this page and updating the effective date.
            Material changes will be communicated by email if you have an account.
          </Section>

          <Section title="10. Contact">
            Questions about this policy? Email us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#6E56CF] hover:underline">{EMAIL}</a>.
          </Section>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6 px-6 text-center">
        <p className="text-xs text-[#5A5955]">
          © 2025 ShipReady ·{' '}
          <Link href="/terms" className="hover:text-[#8B8A85] transition-colors">Terms of Service</Link>
        </p>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-medium text-[#F1F0EE] mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
