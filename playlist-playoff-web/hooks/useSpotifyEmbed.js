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
 * Mounts one Spotify embed controller against whatever DOM node `elRef` is
 * currently attached to.
 *
 * ROOT-CAUSE FIX: `elRef` is now a CALLBACK ref (a function), not a plain
 * useRef object. That's what was actually breaking every matchup after the
 * first one.
 *
 * What was happening: BattleScreen wrapped each side in a motion.div keyed
 * on the matchup (`key={`a-${matchKey}`}`). Every new song pair made React
 * throw away that entire subtree — including the plain `<div>` this hook's
 * old object-ref pointed at — and mount a brand new one in its place. A
 * plain `useRef` object never re-fires anything when the DOM node underneath
 * it gets swapped out, so the controller built on mount #1 just kept sitting
 * there attached to a node that had already been removed from the page,
 * silently eating every future `loadUri()` call. Visually: song 1 played
 * fine, every song after it showed a dead/frozen embed.
 *
 * A callback ref calls this function every time the attached node changes
 * (mount, unmount, or swap to a different node), so the effect below knows
 * the instant it needs to tear down the old controller and build a fresh
 * one against whatever node is actually on screen now. This makes the hook
 * correct regardless of whether a parent component happens to remount its
 * container — which is also why BattleScreen.jsx no longer needs that
 * per-matchup `key` at all (see the comment there).
 */
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
