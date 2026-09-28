export function scrollToWaitlist() {
  if (typeof document === 'undefined') return;
  document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
