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

// `loaded` is true once the embed has actually finished loading the URI most
// recently passed to loadUri() — driven by the embed's own `ready` event, not
// a guessed timer. Skeleton overlays key off it so they lift exactly when the
// content is there.
//   MIN_SKELETON_MS  a load that finishes instantly still holds the skeleton
//                    this long, so it reads as a beat instead of a flicker.
//   Fallback         if `ready` never arrives the skeleton still lifts. Until
//                    we've SEEN `ready` fire for a second-or-later load (proof
//                    it re-fires after loadUri) the fallback is short, so a
//                    build of the embed that doesn't re-fire can't leave the
//                    skeleton up; once proven, it's generous for slow networks.
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
      // Tear the embed down with its panel so a preview that's playing stops
      // the moment the card is removed.
      try {
        controller?.destroy?.();
      } catch {
        // embed already gone
      }
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
