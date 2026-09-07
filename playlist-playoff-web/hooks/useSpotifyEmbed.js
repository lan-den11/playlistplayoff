'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

let iframeApiPromise = null;

function loadSpotifyIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (iframeApiPromise) return iframeApiPromise;
  iframeApiPromise = new Promise((resolve) => {
    window.onSpotifyIframeApiReady = (IFrameAPI) => resolve(IFrameAPI);
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);
  });
  return iframeApiPromise;
}

/**
 * Mounts one Spotify embed controller on the returned ref. Scoped per
 * component instance instead of the original's module-level controllerA /
 * controllerB / controllerChamp globals — mount three of these (side A, side
 * B, champion) and each manages its own lifecycle independently.
 */
export function useSpotifyEmbed() {
  const elRef = useRef(null);
  const controllerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (cancelled || !IFrameAPI || !elRef.current || controllerRef.current) return;
      const embedHeight = window.innerWidth <= 600 ? '80' : '152';
      IFrameAPI.createController(elRef.current, { width: '100%', height: embedHeight, uri: '' }, (controller) => {
        if (cancelled) return;
        controllerRef.current = controller;
        setReady(true);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadUri = useCallback((uri) => {
    if (controllerRef.current && uri) controllerRef.current.loadUri(uri);
  }, []);

  return { elRef, ready, loadUri };
}
