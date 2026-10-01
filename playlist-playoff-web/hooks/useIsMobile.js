'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 767px), (pointer: coarse)';

let mql;
const getMql = () => (mql ??= window.matchMedia(QUERY));

function subscribe(callback) {
  const query = getMql();
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

const getSnapshot = () => getMql().matches;
const getServerSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
