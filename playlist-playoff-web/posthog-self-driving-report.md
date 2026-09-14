# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for this web app with Session Replay, Error Tracking, and Support enabled. Health checks, Error Tracking, Support tickets, and GitHub Issues already have enabled signal sources; no source rows required changes in this run.

Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/606762/inbox) within about 30 minutes as the scheduled checks run and recordings arrive.

## AI data processing

Approved by the wizard gate.

## GitHub

| Item | Status |
| --- | --- |
| GitHub App | Already connected before this run |
| GitHub Issues warehouse source | Already connected and verified: `01a09905-8e85-0000-2efc-4623cd07dfdd` |
| Repository | `lan-den11/playlistplayoff` |
| Responder-consumed table | `issues`, synced successfully |
| GitHub Issues responder | Already enabled |

## Products enabled

| Product | Result | Web SDK check |
| --- | --- | --- |
| Session Replay | Already enabled | `instrumentation-client.js` does not disable session recording. |
| Error Tracking | Already enabled | `instrumentation-client.js` enables exception capture. |
| Support (Conversations) | Already enabled | Tickets require an inbound email, inbox, or Slack channel before data can arrive. |

## Signal sources

| Signal source | Action | Notes |
| --- | --- | --- |
| `signals_scout` / `cross_source_issue` | On by default | No opt-out row exists. |
| `health_checks` / `health_issue` | Already enabled | Setup health checks are actionable for every project. |
| `error_tracking` / `issue_created` | Already enabled | Native error intake. |
| `error_tracking` / `issue_reopened` | Already enabled | Native error intake. |
| `error_tracking` / `issue_spiking` | Already enabled | Native error intake. |
| `conversations` / `ticket` | Already enabled | Idle until a Support channel is connected. |
| `github` / `issue` | Already enabled | GitHub warehouse source is completed and syncing issues. |
| Session Replay responder | Deliberately skipped | Replay reaches Self-driving through Replay Vision scanners, not a retired source row. |

## Connected tools

| Tool | Selection and connection result |
| --- | --- |
| GitHub Issues | Selected; already connected and verified through the existing `Github` warehouse source. Its responder was already enabled. |
| Linear, Jira, Sentry, Zendesk, and other catalog tools | Not selected; no additional responder was enabled. |

## Scout troop

**Enabled: 5 scouts**, all at the server default daily cadence and configured to emit to the Self-driving inbox.

| Scout | Why it is enabled |
| --- | --- |
| `signals-scout-general` | Looks for cross-product correlations and uncategorized surfaces. |
| `signals-scout-health-checks` | Prioritizes actionable PostHog setup-health issues. |
| `signals-scout-product-analytics` | Watches product-flow, lifecycle, funnel, and retention regressions. |
| `signals-scout-web-analytics` | Watches web traffic, attribution, and landing-page health. |
| `signals-scout-playlist-bracket-completion` | Existing product-specific coverage for playlist loading, bracket starts, and completed brackets. |

**Disabled: 23 scouts** to keep the troop selective and below the ten-scout quality ceiling.

| Scout | Reason left disabled |
| --- | --- |
| `signals-scout-ai-observability` | No repo evidence of an application LLM surface. |
| `signals-scout-anomaly-detection` | No established saved-insight watchlist; product and web scouts own the primary surfaces. |
| `signals-scout-apm` | No distributed tracing evidence. |
| `signals-scout-conversations` | Support ticket intake is already covered by the native responder. |
| `signals-scout-csp-violations` | No CSP reporting configuration was found. |
| `signals-scout-customer-analytics` | No account or group analytics evidence. |
| `signals-scout-data-pipelines` | No CDP or workflow-pipeline evidence. |
| `signals-scout-data-warehouse` | GitHub issue sync is narrow and healthy; it is not a primary product surface. |
| `signals-scout-error-tracking` | Covered by the native Error Tracking sources. |
| `signals-scout-experiments` | No active experiment evidence. |
| `signals-scout-feature-flags` | No active feature-flag evidence. |
| `signals-scout-inbox-validation` | There are no shipped Self-driving fixes to validate yet. |
| `signals-scout-insight-alerts` | No configured alert evidence. |
| `signals-scout-logs` | Not selected as a primary surface for this web app. |
| `signals-scout-mcp-tool-calls` | No application MCP telemetry surface. |
| `signals-scout-observability-gaps` | Health checks are the higher-priority configuration monitor today. |
| `signals-scout-replay-vision` | Existing scanners need observations before a cross-scanner analysis is useful. |
| `signals-scout-revenue-analytics` | No payment or revenue integration evidence. |
| `signals-scout-session-replay` | Covered by Replay Vision scanners. |
| `signals-scout-skills-store` | No established skills-store workflow to monitor. |
| `signals-scout-surveys` | No active surveys exist. |
| `signals-scout-tasks` | No confirmed Tasks workflow. |
| `signals-scout-web-vitals` | Web traffic health is the current higher-priority web surface. |

### Scout run budget

- Maximum: **100 runs per day**
- Runs used today: **3**
- Runs remaining today: **97**
- Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

## Custom scouts

No new custom scouts were created in this run. The existing `signals-scout-playlist-bracket-completion` already covers the core domain loop: playlist loading, starting a bracket, and completing it, with broad-reach failure or completion regressions as its discriminator.

Two additional surfaces were considered and proposed, then declined:

| Surface | Decision | Why it was not added |
| --- | --- | --- |
| Multiplayer waitlist reliability | Proposed, declined | The waitlist has success/failure instrumentation, but product analytics partially covers the flow; a dedicated scout would mainly add entry-volume silence and failure-spike coverage. |
| Result sharing health | Proposed, declined | Copying and image-download behavior is instrumented, but this is a secondary completion surface. |

Error bursts and session-replay friction were ruled out because they have dedicated native and Replay Vision routes. If any future custom scout becomes noisy, set `emit: false` in its scout configuration to switch it to dry-run without sending inbox reports.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes clear defects to the Self-driving inbox. These scanners are the only part of this setup that spends Replay Vision quota; each finding has half weight and needs independent corroboration before it is promoted into a report.

No recordings were found in the last 30 days. The following existing signal-emitting scanners already cover the two required monitor briefs, so no duplicate scanners were created. They will begin observing when recordings are available.

| Monitor brief | Scanner | Status | Query scope | Sampling | Estimated monthly spend |
| --- | --- | --- | --- | --- | --- |
| Breakage monitor | Playlist bracket flow breakage | Skipped — existing scanner already covers it | Recordings visiting `/bracket`, the flow for loading a playlist, configuring a bracket, choosing tracks, reaching a winner, and sharing results. | Focused, 10% | 0 observations; 0 credits (no recordings yet) |
| Frustration monitor | High-interaction user frustration | Skipped — existing scanner already covers it | Recordings with more than five clicks; it intentionally has no URL filter, keeping its scope distinct from the bracket-flow monitor. | Focused, 5% | 0 observations; 0 credits (no recordings yet) |

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled ticket responder has data to process.
- [ ] Generate real web traffic and Session Replay recordings; the existing Replay Vision scanners cannot observe sessions until recordings exist.
- [ ] Review and rate the first Replay Vision observations to calibrate each scanner.
- [ ] Consider enabling `signals-scout-replay-vision` after the scanners accumulate observations.

## What happens next

Fresh scout configurations are picked up within about 30 minutes and draw from the daily scout-run budget. Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/606762/inbox); immediately actionable reports can begin coding tasks.

## Files modified or created

- Updated `posthog-self-driving-report.md`.
- No application source files or environment files were changed.
