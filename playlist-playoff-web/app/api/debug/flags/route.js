import { debugEvaluateFlags } from '../../../../lib/posthog-server';

export async function GET() {
  const result = await debugEvaluateFlags();
  return Response.json({
    resolvedAt: new Date().toISOString(),
    ...result,
  });
}
