'use client';

import { useRouter } from 'next/navigation';
import GradientButton from '../ui/GradientButton';
import SiteHeader from '../ui/SiteHeader';

export default function Navbar({ accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';

  return (
    <SiteHeader sticky>
      <GradientButton
        gradient="brand"
        className="hidden sm:inline-flex"
        onClick={() => router.push(isOpen ? '/bracket' : '/waitlist')}
      >
        {isOpen ? 'Start a bracket' : 'Join the waitlist'}
      </GradientButton>
    </SiteHeader>
  );
}
