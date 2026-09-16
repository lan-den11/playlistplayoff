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

// Spotify's own compact-vs-normal breakpoint is about the *embed's own*
// width, not the viewport's. A two-up battle layout can put each embed in a
// ~320–380px column even on a wide desktop window, so picking the layout
// from window.innerWidth (the old approach) chose "normal" (152px, wider
// content) for a column that was really only compact-sized — and the
// Spotify iframe then needed its own internal scrollbar to fit everything.
// Measuring the actual mounted container fixes this everywhere the embed
// is used (homepage teaser and the real bracket) with one change.
const COMPACT_BREAKPOINT = 380;

export function useSpotifyEmbed() {
  const [node, setNode] = useState(null);
  const controllerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(null);

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
      const width = node.getBoundingClientRect().width || node.offsetWidth || window.innerWidth;
      const embedHeight = width < COMPACT_BREAKPOINT ? '80' : '152';
      setHeight(embedHeight);
      IFrameAPI.createController(node, { width: '100%', height: embedHeight, uri: '' }, (controller) => {
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

  return { elRef, ready, loadUri, height };
}
