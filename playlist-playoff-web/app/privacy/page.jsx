import LegalPage, { Section, List, TextLink } from '../../components/legal/LegalPage';
import { PRIVACY_EMAIL, LEGAL_ENTITY } from '../../lib/contact';

export const metadata = {
  title: 'Privacy Policy — Playlist Playoff',
  description: 'How Playlist Playoff collects, uses, and protects your information.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = 'September 30, 2026';

const Strong = ({ children }) => <strong className="font-semibold text-zinc-200">{children}</strong>;

const Contact = () =>
  PRIVACY_EMAIL ? (
    <TextLink href={`mailto:${PRIVACY_EMAIL}?subject=Privacy%20request`}>{PRIVACY_EMAIL}</TextLink>
  ) : (
    'the contact details listed on our website'
  );

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <Section title="Who we are">
        <p>
          Playlist Playoff ("we," "us") lets you turn playlists into head-to-head song brackets. This policy explains what
          information we collect when you use our website, how we use it, and the choices you have.
        </p>
        <p>
          <Strong>Data controller:</Strong> {LEGAL_ENTITY}. <Strong>Privacy contact:</Strong> <Contact />.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>
          <Strong>Information you give us</Strong>
        </p>
        <List>
          <li>Your email address when you join the waitlist, plus which sign-up form you used.</li>
          <li>Account details (such as email, name, and sign-in method) if you create an account or sign in.</li>
          <li>Your Spotify username and Last.fm username, if you choose to save them.</li>
        </List>
        <p>
          <Strong>Information collected automatically</Strong>
        </p>
        <List>
          <li>
            Usage analytics: pages viewed, buttons clicked, matchups chosen, device and browser type, referring page, and
            approximate location derived from your IP address.
          </li>
          <li>Technical and security logs, including your IP address, used to keep the service running and prevent abuse.</li>
        </List>
        <p>
          <Strong>Information stored on your device</Strong>
        </p>
        <List>
          <li>Saved bracket progress, your Last.fm username override, your cookie choice, and display performance settings.</li>
          <li>Analytics identifiers, only where permitted or where you have agreed (see "Cookies and similar technologies").</li>
          <li>Sign-in session cookies, if you sign in.</li>
        </List>
        <p>We do not ask for government IDs, payment details, or other sensitive information. Please do not send them to us.</p>
      </Section>

      <Section title="How we use information">
        <List>
          <li>To operate, maintain, and improve Playlist Playoff.</li>
          <li>To manage the waitlist and email you launch news and updates, including your Playoff Pro free week.</li>
          <li>To understand how the site is used and fix problems.</li>
          <li>To protect the service against spam, fraud, and abuse.</li>
          <li>To comply with legal obligations.</li>
        </List>
        <p>
          We do not sell your personal information, and we do not share it for cross-context behavioral advertising. You can opt out of
          emails at any time by emailing <Contact /> from the address you signed up with, and we will stop and, if you ask, remove you
          from the waitlist.
        </p>
      </Section>

      <Section title="Legal bases (EEA, UK, and Switzerland)">
        <p>Where these laws apply, we rely on:</p>
        <List>
          <li>Your consent, for analytics cookies and similar technologies and for waitlist communications.</li>
          <li>Our legitimate interests in running, securing, and improving the service.</li>
          <li>Legal obligations, where we are required to process information by law.</li>
        </List>
        <p>You can withdraw consent at any time using "Cookie settings" in the footer or by contacting us.</p>
      </Section>

      <Section title="Cookies and similar technologies">
        <p>
          <Strong>Essential.</Strong> Sign-in sessions, bot protection, saving your cookie choice, saved bracket progress, and display
          settings. The site cannot work properly without these.
        </p>
        <p>
          <Strong>Analytics.</Strong> We use PostHog to measure usage. In the European Economic Area, the United Kingdom, and
          Switzerland, analytics stay off until you accept. Elsewhere they are on by default, and you can turn them off at any time with
          "Cookie settings" in the footer.
        </p>
      </Section>

      <Section title="Service providers and international transfers">
        <p>We use the following providers to run the service, each under its own privacy terms:</p>
        <List>
          <li>Render, for website hosting.</li>
          <li>Clerk, for authentication and waitlist management.</li>
          <li>PostHog, for analytics.</li>
          <li>Cloudflare Turnstile, for bot protection on forms.</li>
          <li>A managed PostgreSQL database provider, to store waitlist and account-related data.</li>
        </List>
        <p>
          These providers may process information in the United States and other countries. Where required, we rely on appropriate
          safeguards for those transfers.
        </p>
        <p>
          Song previews are provided through Spotify embeds. When you load or play an embed, Spotify may collect information and set
          cookies as described in the{' '}
          <TextLink href="https://www.spotify.com/legal/privacy-policy/">Spotify Privacy Policy</TextLink>. If you use Last.fm features,
          your Last.fm username and the tracks you view are sent to Last.fm, which handles them under its{' '}
          <TextLink href="https://www.last.fm/legal/privacy">Privacy Policy</TextLink>.
        </p>
        <p>We may also disclose information when required by law or to protect the rights, safety, and security of our users and service.</p>
      </Section>

      <Section title="Data retention">
        <p>
          We keep personal information only as long as needed for the purposes above, then delete or anonymize it. Waitlist emails are kept
          until you ask us to remove them or until we no longer need them for launch communications.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Depending on where you live, you may have the right to:</p>
        <List>
          <li>Access the personal information we hold about you and receive a copy, including in a portable format.</li>
          <li>Correct inaccurate information and request deletion.</li>
          <li>Object to or restrict certain processing, and withdraw consent.</li>
          <li>Not be discriminated against for exercising privacy rights (California residents).</li>
        </List>
        <p>
          To make a request, email <Contact /> with the subject "Privacy request" from the address linked to your waitlist entry or
          account so we can verify it is you. We aim to respond within 30 days. If you are in the EEA, UK, or Switzerland, you can also
          complain to your local data protection authority, such as the{' '}
          <TextLink href="https://ico.org.uk/make-a-complaint/">UK Information Commissioner's Office</TextLink> or the authority
          listed by the{' '}
          <TextLink href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en">European Data Protection Board</TextLink>.
        </p>
      </Section>

      <Section title="Children">
        <p>
          Playlist Playoff is not intended for children under 13, and we do not knowingly collect personal information from them. If
          you believe a child has given us personal information, contact us and we will delete it.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We protect your information with HTTPS encryption, encrypted database connections, sign-in handled by Clerk, and bot protection
          and rate limiting on forms. No system is perfectly secure, so we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy from time to time. When we do, we will change the "Last updated" date above, and for material
          changes we will take additional steps where required by law.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions or requests? Contact {LEGAL_ENTITY} at <Contact />.
        </p>
      </Section>
    </LegalPage>
  );
}
