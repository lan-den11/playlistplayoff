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
      const embedHeight = window.innerWidth <= 600 ? '80' : '152';
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

  return { elRef, ready, loadUri };
}
