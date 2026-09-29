'use client';

import { useRouter } from 'next/navigation';
import GradientButton from '../ui/GradientButton';
import SiteHeader from '../ui/SiteHeader';
import { scrollToWaitlist } from '../../lib/scroll';
import { captureEvent } from '../../lib/posthog-client';

export default function Navbar({ accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';

  function handleClick() {
    captureEvent('cta_clicked', { location: 'navbar', action: isOpen ? 'start_bracket' : 'join_waitlist' });
    if (isOpen) router.push('/bracket');
    else scrollToWaitlist();
  }

  return (
    <SiteHeader>
      <GradientButton gradient="brand" size="sm" className="hidden sm:inline-flex" onClick={handleClick}>
        {isOpen ? 'Start a bracket' : 'Join the waitlist'}
      </GradientButton>
    </SiteHeader>
  );
}
