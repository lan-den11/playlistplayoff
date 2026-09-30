import posthog from 'posthog-js';
import { isPostHogConfigured } from './posthog-client';

export const CONSENT_KEY = 'ppConsent_v1';
export const OPEN_CONSENT_EVENT = 'pp:open-consent';

const EUROPEAN_TIMEZONES = new Set([
  'Atlantic/Reykjavik',
  'Atlantic/Canary',
  'Atlantic/Madeira',
  'Atlantic/Azores',
  'Atlantic/Faroe',
]);

export function readStoredConsent() {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

export function storeConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
}

export function clearStoredConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {}
}

export function timezoneNeedsConsent() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return zone.startsWith('Europe/') || EUROPEAN_TIMEZONES.has(zone);
  } catch {
    return false;
  }
}

export async function detectConsentRequired() {
  try {
    const res = await fetch('/api/consent', { cache: 'no-store' });
    const data = await res.json();
    if (typeof data.required === 'boolean') return data.required;
  } catch {}
  return timezoneNeedsConsent();
}

function isInternalDevice() {
  try {
    return localStorage.getItem('ppInternal') === '1';
  } catch {
    return false;
  }
}

export function applyAnalytics(granted) {
  if (!isPostHogConfigured || process.env.NODE_ENV === 'development' || isInternalDevice()) return;
  try {
    const optedOut = posthog.has_opted_out_capturing();
    if (granted && optedOut) {
      posthog.opt_in_capturing({ captureEventName: false });
      posthog.capture('$pageview');
    } else if (!granted && !optedOut) {
      posthog.opt_out_capturing();
    }
  } catch {}
}
