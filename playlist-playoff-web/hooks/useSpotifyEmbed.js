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

export const EMBED_HEIGHT = 80;

const MIN_SKELETON_MS = 220;
const FALLBACK_UNPROVEN_MS = 800;
const FALLBACK_PROVEN_MS = 2500;

export function useSpotifyEmbed() {
  const [node, setNode] = useState(null);
  const controllerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadRef = useRef({ pending: false, startedAt: 0, count: 0, refireSeen: null, minTimer: 0, fallbackTimer: 0 });

  const elRef = useCallback((el) => {
    setNode(el);
  }, []);

  const clearTimers = useCallback(() => {
    clearTimeout(loadRef.current.minTimer);
    clearTimeout(loadRef.current.fallbackTimer);
  }, []);

  const settle = useCallback(() => {
    loadRef.current.pending = false;
    clearTimers();
    setLoaded(true);
  }, [clearTimers]);

  const onEmbedReady = useCallback(() => {
    const state = loadRef.current;
    if (!state.pending) return;
    if (state.count > 1) state.refireSeen = true;
    clearTimeout(state.minTimer);
    state.minTimer = setTimeout(settle, Math.max(0, MIN_SKELETON_MS - (performance.now() - state.startedAt)));
  }, [settle]);

  useEffect(() => {
    if (!node) {
      setReady(false);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    setLoaded(false);
    controllerRef.current = null;

    loadSpotifyIframeApi().then((IFrameAPI) => {
      if (cancelled || !IFrameAPI) return;
      IFrameAPI.createController(node, { width: '100%', height: String(EMBED_HEIGHT), uri: '' }, (controller) => {
        if (cancelled) return;
        controllerRef.current = controller;
        controller.addListener('ready', onEmbedReady);
        setReady(true);
      });
    });

    return () => {
      cancelled = true;
      clearTimers();
      loadRef.current.pending = false;
      const controller = controllerRef.current;
      controllerRef.current = null;
      try {
        controller?.destroy?.();
      } catch {}
    };
  }, [node, onEmbedReady, clearTimers]);

  const loadUri = useCallback(
    (uri) => {
      const controller = controllerRef.current;
      if (!controller || !uri) return;
      const state = loadRef.current;
      clearTimers();
      state.pending = true;
      state.startedAt = performance.now();
      state.count += 1;
      setLoaded(false);
      controller.loadUri(uri);
      state.fallbackTimer = setTimeout(
        () => {
          if (state.count > 1) state.refireSeen = false;
          settle();
        },
        state.refireSeen === true ? FALLBACK_PROVEN_MS : FALLBACK_UNPROVEN_MS
      );
    },
    [clearTimers, settle]
  );

  return { elRef, ready, loaded, loadUri, height: EMBED_HEIGHT };
}
