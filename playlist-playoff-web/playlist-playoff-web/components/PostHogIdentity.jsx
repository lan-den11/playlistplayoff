'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { identifyPerson, resetPerson } from '../lib/posthog-client';

export default function PostHogIdentity() {
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedUserIdRef = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (identifiedUserIdRef.current && identifiedUserIdRef.current !== user.id) resetPerson();

      identifyPerson(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName || undefined,
      });
      identifiedUserIdRef.current = user.id;
      return;
    }

    if (identifiedUserIdRef.current) {
      resetPerson();
      identifiedUserIdRef.current = null;
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
