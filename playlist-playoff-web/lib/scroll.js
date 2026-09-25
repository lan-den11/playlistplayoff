// Shared by every "Join the waitlist" entry point on the homepage — the
// dedicated /waitlist page is gone, so these just bring the visitor to the
// waitlist section (MultiplayerTeaser, id="waitlist") instead of navigating.
export function scrollToWaitlist() {
  if (typeof document === 'undefined') return;
  document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
