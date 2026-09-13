import { PostHog } from 'posthog-node';

export function getPostHogClient() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if ((!token || !host) && process.env.NODE_ENV === 'development') {
    const missingVariable = !token ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN' : 'NEXT_PUBLIC_POSTHOG_HOST';
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
    );
  }

  if (!token || !host) return null;

  return new PostHog(token, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
  });
}

export async function captureServerEvent({ distinctId, event, properties }) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.capture({ distinctId, event, properties });
  } finally {
    await posthog.shutdown();
  }
}

export async function captureServerException(error, distinctId, properties) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.captureException(error, distinctId, properties);
  } finally {
    await posthog.shutdown();
  }
}
