import posthog from 'posthog-js';

export const isPostHogConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST
);

export function captureEvent(event, properties) {
  if (!isPostHogConfigured) return;
  posthog.capture(event, properties);
}

export function identifyPerson(distinctId, properties) {
  if (!isPostHogConfigured) return;
  posthog.identify(distinctId, properties);
}

export function resetPerson() {
  if (!isPostHogConfigured) return;
  posthog.reset();
}

export function captureClientException(error, properties) {
  if (!isPostHogConfigured) return;
  posthog.captureException(error, properties);
}
