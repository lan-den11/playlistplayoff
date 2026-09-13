# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured with Session Replay, Error Tracking, and Support enabled, plus native health, error, support, and GitHub Issues responders. A focused scout and two Replay Vision monitors cover the main playlist-bracket journey and visible interaction problems.

Findings will begin appearing in the [Self-driving inbox](https://us.posthog.com/project/606762/inbox) within about 30 minutes as scouts run and recordings become available.

## AI data processing

Approved by the wizard gate before this setup.

## GitHub

| Item | Status |
| --- | --- |
| GitHub App | Already connected before this run |
| GitHub Issues warehouse source | Connected by this setup; source `01a09905-8e85-0000-2efc-4623cd07dfdd`; first sync started |
| Synced table | `issues` only — the table consumed by the responder |
| GitHub Issues responder | Enabled |

More GitHub tables can be enabled later from the data-warehouse source UI if needed; this setup intentionally syncs only issues.

## Products enabled

| Product | Result | Notes |
| --- | --- | --- |
| Session Replay | Already enabled | Web client initialization is clean: it does not disable session recording. |
| Error Tracking | Already enabled | Web client initialization has exception capture enabled. |
| Support (Conversations) | Enabled | Tickets begin arriving only after an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Signal source | Action | Notes |
| --- | --- | --- |
| `signals_scout` / `cross_source_issue` | On by default | No row is required; no prior opt-out was found. |
| `health_checks` / `health_issue` | Enabled | Configuration `01a09901-95af-75eb-9319-68bb98182fd1`. |
| `error_tracking` / `issue_created` | Enabled | Configuration `01a09901-95ee-7362-ab92-0b6aa0650f18`. |
| `error_tracking` / `issue_reopened` | Enabled | Configuration `01a09901-9649-7068-b8a4-89204880c489`. |
| `error_tracking` / `issue_spiking` | Enabled | Configuration `01a09901-95ed-7780-80ed-3cdee01cb17d`. |
| `conversations` / `ticket` | Enabled | Configuration `01a09901-95c9-7707-8968-d0049e969849`; idle until an inbound channel is connected. |
| `github` / `issue` | Enabled | Configuration `01a09905-9964-7bb2-a6ab-1deb983a7860`; source status is completed. |
| Session replay responder | Deliberately not created | Replay findings are delivered through Replay Vision monitors below. |

## Connected tools

| Tool | Selection and connection result |
| --- | --- |
| GitHub Issues | Selected and connected by this setup; the repository's issues source is syncing. |
| Linear, Jira, Sentry, Zendesk, and other catalog tools | Not selected; no responder was enabled. |

## Scout troop

**Enabled: 5 scouts** — each runs on the server default cadence (currently daily) and emits to the Self-driving inbox.

| Scout | Why it is enabled |
| --- | --- |
| `signals-scout-general` | Cross-product correlations and surfaces without a specialist. |
| `signals-scout-product-analytics` | Core product-flow regressions. |
| `signals-scout-web-analytics` | Traffic, attribution, and landing-page health. |
| `signals-scout-health-checks` | Actionable PostHog setup-health issues. |
| `signals-scout-playlist-bracket-completion` | The approved custom monitor for the key playlist-bracket journey. |

**Disabled: 23 built-in scouts** — these can be enabled later if their product surface becomes active.

| Scout | Reason left disabled |
| --- | --- |
| `signals-scout-ai-observability` | No confirmed LLM trace usage. |
| `signals-scout-anomaly-detection` | No established saved-insight watchlist yet. |
| `signals-scout-apm` | No confirmed distributed tracing usage. |
| `signals-scout-conversations` | Support responder covers ticket intake; no inbound channel is connected yet. |
| `signals-scout-csp-violations` | No CSP reporting was found. |
| `signals-scout-customer-analytics` | No account/group analytics evidence. |
| `signals-scout-data-pipelines` | No CDP or workflow pipeline evidence. |
| `signals-scout-data-warehouse` | The new GitHub source is narrow and has no observed sync history yet. |
| `signals-scout-error-tracking` | Covered by the native Error Tracking responders. |
| `signals-scout-experiments` | No active experiment evidence. |
| `signals-scout-feature-flags` | No active flag usage was found in the application. |
| `signals-scout-inbox-validation` | Fresh setup has no shipped Self-driving fixes to validate. |
| `signals-scout-insight-alerts` | No configured alert evidence. |
| `signals-scout-logs` | No confirmed PostHog Logs usage. |
| `signals-scout-mcp-tool-calls` | No confirmed MCP telemetry surface. |
| `signals-scout-observability-gaps` | The focused health scout is the current higher-value setup monitor. |
| `signals-scout-replay-vision` | Fresh monitors need observations first; this analytical layer can be enabled later. |
| `signals-scout-revenue-analytics` | No payment or revenue source evidence. |
| `signals-scout-session-replay` | Covered by the Replay Vision monitors below. |
| `signals-scout-skills-store` | No established skills-store workflow to monitor. |
| `signals-scout-surveys` | No surveys are currently in use. |
| `signals-scout-tasks` | No confirmed Tasks usage. |
| `signals-scout-web-vitals` | No evidence yet that Core Web Vitals monitoring is a current priority. |

### Scout run budget

- Maximum: **100 runs per day**
- Runs used today: **0**
- Runs remaining today: **100**
- Current announcement: Scouts are in early access; the project can run up to 100 scouts per day.

## Custom scouts

| Scout | Status | Design |
| --- | --- | --- |
| `signals-scout-playlist-bracket-completion` | Created and active | Watches the flow in `hooks/useBracket.js`, from playlist load through bracket start and completion. Its discriminator is a broad-reach completion or load-failure rate change against completed historical windows, rather than raw event volume. It complements the built-in product-flow scout with domain-specific failure and abandonment checks. |
| Multiplayer waitlist monitor | Proposed and declined | The `components/home/MultiplayerTeaser.jsx` signup path has a success/failure pair, but no scout was created. |

Surfaces ruled out: error bursts and replay friction already have dedicated native routes; generic traffic and product-flow shifts have enabled built-ins. If the custom scout proves noisy, set `emit: false` on its configuration in PostHog to keep it running in dry-run mode without creating inbox reports.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes clear defects into the inbox. These are the only items in this setup that consume Replay Vision quota. Each finding enters at half weight, so independent corroboration is required before an inbox report is promoted.

The initial recording probe found no recordings, so both monitors are armed and will start working as soon as recordings arrive. The current quota is 2,500 credits remaining; each scanner was estimated at 0 monthly credits and 0 observations because there were no matching recordings.

| Scanner | Status | Query scope | Sampling | Estimated monthly spend |
| --- | --- | --- | --- | --- |
| [Playlist bracket flow breakage](https://us.posthog.com/project/606762/replay-vision/01a09908-58a6-7d91-a783-83c7e109fd18) | Created | Recordings that visited `/bracket`, the route containing playlist loading, bracket setup, matchup selection, winner completion, and sharing. | Focused, 10% | 0 observations; 0 credits |
| [High-interaction user frustration](https://us.posthog.com/project/606762/replay-vision/01a09908-58ad-7d67-8ad0-1e3f9ecb8dfd) | Created | High-interaction recordings with more than five clicks; it intentionally has no URL filter, keeping it distinct from the bracket-flow monitor. | Focused, 5% | 0 observations; 0 credits |

After recordings arrive, rate early observations in each scanner. Feedback becomes a configuration recommendation available for review. See [Replay Vision scanner guidance](https://posthog.com/docs/replay-vision/creating-scanners) for the operational model.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled ticket responder has data to process.
- [ ] Generate real web traffic and Session Replay recordings; the two armed Replay Vision monitors cannot observe sessions until recordings exist.
- [ ] Review and rate the first Replay Vision observations to calibrate each monitor.
- [ ] Consider enabling the Replay Vision analytical scout after the monitors have accumulated observations.

## What happens next

Fresh scout configurations are picked up within about 30 minutes and draw from the project’s daily run budget. Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/606762/inbox); immediately actionable reports can begin coding tasks.

## Files modified or created

- Created `posthog-self-driving-report.md`.
- No application source files or environment files were changed.
