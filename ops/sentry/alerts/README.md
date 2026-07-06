# Sentry alert presets — header.logo

Two ready-to-apply Issue Alert rules for the `header.logo.error` stream.
Both key off the fingerprint segment `header.logo.error` (set by
`src/lib/sentry-forwarder.server.ts`) plus the `stage` tag, so alerts fire
per-stage and never merge stages into one noisy issue.

## Why two rules

The forwarder already samples the tail of a storm (see
`src/lib/sentry-sampler.server.ts`), so Sentry only sees:

- every **terminal** failure (inline-SVG fell through),
- the first 3 events per `stage|variant` per minute,
- 1-in-20 of the rest.

The alerts below match that shape:

| File                                                               | Fires when                                                                                                     | Latency   | Use for                                                                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| [`header-logo-spike.json`](./header-logo-spike.json)               | Any single Sentry issue tagged `logger:header.logo` receives **≥ 10 events in 5 min** (comparisonType `count`) | ~5 min    | Regression / mass-fail (e.g. CDN outage on `fallback-cdn-full`)                                                 |
| [`header-logo-terminal.json`](./header-logo-terminal.json)         | A new or reappeared Sentry issue tagged `logger:header.logo` **and** `terminal:true` (any terminal stage)      | immediate | Real user got no logo at all — page-load-blocking severity                                                      |
| [`header-logo-svg-terminal.json`](./header-logo-svg-terminal.json) | Same as above, narrowed to `stage:fallback-inline-svg` — the last link in the chain                            | immediate | Actionable P1: the inline SVG (last-resort fallback) failed — investigate CSP / data-URI blocking / MIME issues |

Because each stage has its own fingerprint segment
(`["header.logo.error", stage, fallbackChain, correlationId]`) Sentry groups
by stage automatically. One rule per project covers all stages — no need to
duplicate per stage.

## Threshold rationale

- **10 events / 5 min** on the spike rule is the elbow between "sampled
  noise" and "systemic failure". Given first-3 pass-through per bucket + 1-in-20
  tail sampling, 10 kept events ≈ **~150 real end-user failures** in 5 min for a
  single `stage|variant` — that's alertable but not paging on a single flaky
  device.
- **Terminal** fires on first-seen / reappeared, no count threshold. Any
  user reaching `fallback-inline-svg` failure is already a P1; even one is
  worth immediate notification.

## Applying the presets

Sentry does not currently import Issue Alert rules from a file via the UI,
so use the REST API. Both JSON documents match the create-rule schema exactly.

```bash
# One-time: export your Sentry credentials.
export SENTRY_AUTH_TOKEN=...        # user auth token with project:write
export SENTRY_ORG=your-org-slug
export SENTRY_PROJECT=your-project-slug

for f in ops/sentry/alerts/*.json; do
  curl -sS -X POST \
    "https://sentry.io/api/0/projects/$SENTRY_ORG/$SENTRY_PROJECT/rules/" \
    -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    --data @"$f" | jq '{id, name}'
done
```

To update an existing rule, PUT to
`/projects/$SENTRY_ORG/$SENTRY_PROJECT/rules/{ruleId}/` with the same body.

## Routing to Slack / PagerDuty

Replace the `NotifyEmailAction` entry in `actions[]`:

```jsonc
// Slack
{
  "id": "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
  "workspace": "<slack workspace id>",
  "channel": "#alerts-frontend",
  "tags": "stage,variant,fallback_chain"
}

// PagerDuty (terminal rule only — do NOT page on the spike rule)
{
  "id": "sentry.integrations.pagerduty.notify_action.PagerDutyNotifyServiceAction",
  "account": "<pagerduty account id>",
  "service": "<pagerduty service id>"
}
```

## Verifying

1. Apply the rules with the curl loop above.
2. In Sentry → Alerts, confirm both rules are **Active** and scoped to the
   `production` environment.
3. Trigger a synthetic failure (block the logo CDN in DevTools, reload) and
   watch `logger:header.logo` events land — the terminal rule should fire
   on the first inline-SVG failure; the spike rule stays quiet until 10
   events accumulate in a 5-minute window.
