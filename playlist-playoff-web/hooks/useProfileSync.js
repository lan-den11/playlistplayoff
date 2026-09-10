'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { fetchProfile, saveProfile as saveProfileRequest } from '../lib/api';

export function useProfileSync({ onLoaded, onEmptyProfile } = {}) {
  const { isSignedIn } = useAuth();
  const { isLoaded } = useUser();
  const wasSignedInRef = useRef(false);

  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProfile();
      onLoaded?.(data);
      if (!data.spotifyUsername && !data.lastfmUsername) onEmptyProfile?.();
    } catch (e) {
      console.error('Could not load saved profile:', e.message);
    } finally {
      setLoading(false);
    }
  }, [onLoaded, onEmptyProfile]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && !wasSignedInRef.current) load();
    wasSignedInRef.current = isSignedIn;
  }, [isLoaded, isSignedIn, load]);

  const save = useCallback(
    async (spotifyUsername, lastfmUsername) => {
      if (!isSignedIn) return;
      try {
        await saveProfileRequest({ spotifyUsername, lastfmUsername });
      } catch (e) {
        console.error('Failed to save profile', e.message);
      }
    },
    [isSignedIn]
  );

  return { loading, save };
}
