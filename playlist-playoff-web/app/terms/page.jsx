import LegalPage, { Section, List, TextLink } from '../../components/legal/LegalPage';
import { CONTACT_EMAIL } from '../../lib/contact';

export const metadata = {
  title: 'Terms of Service — Playlist Playoff',
  description: 'The terms that apply when you use Playlist Playoff.',
  alternates: { canonical: '/terms' },
};

const UPDATED = 'September 30, 2026';

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <Section title="Acceptance of these terms">
        <p>
          By accessing or using Playlist Playoff (the "Service"), you agree to these Terms of Service and our{' '}
          <TextLink href="/privacy">Privacy Policy</TextLink>. If you do not agree, please do not use the Service.
        </p>
      </Section>

      <Section title="The Service">
        <p>
          Playlist Playoff lets you turn public playlists into head-to-head song brackets, with song previews provided through third-party
          embeds. The Service is in an early stage, and features, availability, and pricing may change, be limited, or be discontinued at
          any time.
        </p>
      </Section>

      <Section title="Eligibility">
        <p>
          You must be at least 13 years old, or the minimum age required in your country to consent to online services, to use the
          Service. If you are under the age of majority where you live, you confirm a parent or guardian has reviewed these terms.
        </p>
      </Section>

      <Section title="Waitlist and the Playoff Pro free week">
        <p>
          Playoff Pro is a planned paid plan. Its features, pricing, and launch date have not been finalized and may change.
        </p>
        <List>
          <li>By joining the waitlist, you agree to receive launch news and updates by email, and you can opt out at any time by contacting us.</li>
          <li>When you join the waitlist, we reserve one free week of Playoff Pro for your email address, redeemable when Playoff Pro launches.</li>
          <li>No payment method is required, and the free week will not turn into a paid subscription unless you choose to subscribe.</li>
          <li>The offer is limited to one free week per person, is non-transferable, and has no cash value.</li>
          <li>
            We may change, limit, or end the offer before launch, and may withhold it or remove a waitlist entry if we reasonably suspect
            duplicate, automated, or fraudulent sign-ups or a breach of these terms.
          </li>
        </List>
      </Section>

      <Section title="Accounts">
        <p>
          If you create an account, you are responsible for keeping your sign-in details secure and for activity under your account. Tell us
          promptly if you suspect unauthorized use. You must give accurate information and may not share your account or impersonate others.
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <List>
          <li>Use the Service unlawfully or in a way that infringes others' rights.</li>
          <li>Scrape, crawl, or bulk-collect data from the Service, or use automated tools to sign up, submit forms, or inflate counters.</li>
          <li>Bypass or interfere with rate limits, bot protection, or other security measures.</li>
          <li>Probe, disrupt, or overload the Service or its infrastructure.</li>
          <li>Reverse engineer or copy the Service, except where the law allows it.</li>
        </List>
      </Section>

      <Section title="Third-party services and content">
        <p>
          Playlist Playoff is not affiliated with, endorsed by, or sponsored by Spotify or Last.fm. Music, track names, artwork, and listening
          data belong to their respective owners and are provided through third-party services whose own terms apply to you, including the{' '}
          <TextLink href="https://www.spotify.com/legal/end-user-agreement/">Spotify Terms of Use</TextLink> and the Last.fm terms. We do not
          host or control that content, and it may change or become unavailable at any time.
        </p>
      </Section>

      <Section title="Shared results">
        <p>
          When you share a bracket result, the link displays the songs and picks in your bracket to anyone who opens it. Only share links you
          are comfortable making visible.
        </p>
      </Section>

      <Section title="Our intellectual property">
        <p>
          The Service, including its design, software, branding, and original content, is owned by Playlist Playoff and protected by
          intellectual property laws. Third-party content remains the property of its owners. We welcome feedback, and you agree we may use
          it without obligation to you.
        </p>
      </Section>

      <Section title="Disclaimers">
        <p>
          The Service is provided "as is" and "as available," without warranties of any kind, whether express or implied, including
          merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the Service will be uninterrupted,
          error-free, or that third-party content will always be available.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the fullest extent permitted by law, Playlist Playoff will not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for any loss of data, profits, or goodwill, arising from your use of the Service. Our total liability for any
          claim relating to the Service is limited to the greater of the amount you paid us in the 12 months before the claim or $50.
        </p>
      </Section>


      <Section title="Termination">
        <p>
          We may suspend or end your access to the Service at any time, including for violations of these terms. You may stop using the Service
          at any time.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms from time to time. Continued use of the Service after changes take effect means you accept the updated
          terms. We will update the "Last updated" date above when we make changes.
        </p>
      </Section>

      <Section title="Governing law">
        <p>
          These terms are governed by the laws of the jurisdiction where the operator of Playlist Playoff is established, without regard to
          conflict-of-law rules. Mandatory consumer protection laws in your country of residence continue to apply.
        </p>
      </Section>

      <Section title="General">
        <p>
          These terms and the Privacy Policy are the entire agreement between you and us about the Service. If a part of these terms is found
          unenforceable, the rest stays in effect.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          {CONTACT_EMAIL ? (
            <>
              Questions about these terms? Email us at <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>.
            </>
          ) : (
            'Questions about these terms? Reach us through the contact details listed on our website.'
          )}
        </p>
      </Section>
    </LegalPage>
  );
}
