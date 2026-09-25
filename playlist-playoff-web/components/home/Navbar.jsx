'use client';

import { useRouter } from 'next/navigation';
import GradientButton from '../ui/GradientButton';
import SiteHeader from '../ui/SiteHeader';
import { scrollToWaitlist } from '../../lib/scroll';

export default function Navbar({ accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';

  return (
    <SiteHeader>
      <GradientButton
        gradient="brand"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => (isOpen ? router.push('/bracket') : scrollToWaitlist())}
      >
        {isOpen ? 'Start a bracket' : 'Join the waitlist'}
      </GradientButton>
    </SiteHeader>
  );
}
