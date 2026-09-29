import posthog from 'posthog-js';

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!posthogToken && process.env.NODE_ENV === 'development') {
  throw new Error(
    'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured'
  );
}

if (!posthogHost && process.env.NODE_ENV === 'development') {
  throw new Error(
    'NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured'
  );
}

function readInternalFlag() {
  try {
    const param = new URLSearchParams(window.location.search).get('internal');
    if (param === '1') localStorage.setItem('ppInternal', '1');
    if (param === '0') localStorage.removeItem('ppInternal');
    return { param, internal: localStorage.getItem('ppInternal') === '1' };
  } catch {
    return { param: null, internal: false };
  }
}

const { param: internalParam, internal: isInternalDevice } = readInternalFlag();

if (posthogToken && posthogHost) {
  posthog.init(posthogToken, {
    opt_out_capturing_by_default: isInternalDevice || process.env.NODE_ENV === 'development',
    api_host: '/ingest',
    ui_host: posthogHost.replace(/\/$/, '').replace('.i.posthog.com', '.posthog.com'),
    defaults: '2026-01-30',
    capture_exceptions: true,
    debug: process.env.NODE_ENV === 'development',
  });

  if (internalParam === '1') posthog.opt_out_capturing();
  if (internalParam === '0' && process.env.NODE_ENV !== 'development') posthog.opt_in_capturing();
}
