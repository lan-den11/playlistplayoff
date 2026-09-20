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

// The ONE place the embed height is defined. It's given to Spotify's
// createController AND returned as `height` so EmbedPanel sizes its own box
// to match — the two must agree or the panel shows dead space (or clips the
// card). 80px is Spotify's compact card, which reads fine at any width, so
// there's no width measuring / 80-vs-152 switching anymore.
export const EMBED_HEIGHT = 80;

export function useSpotifyEmbed() {
  const [node, setNode] = useState(null);
  const controllerRef = useRef(null);
  const [ready, setReady] = useState(false);

  const elRef = useCallback((el) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;
    let cancelled = false;
    setReady(false);
    controllerRef.current = null;

    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (cancelled || !IFrameAPI) return;
      IFrameAPI.createController(node, { width: '100%', height: String(EMBED_HEIGHT), uri: '' }, (controller) => {
        if (cancelled) return;
        controllerRef.current = controller;
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [node]);

  const loadUri = useCallback((uri) => {
    if (controllerRef.current && uri) controllerRef.current.loadUri(uri);
  }, []);

  return { elRef, ready, loadUri, height: EMBED_HEIGHT };
}
