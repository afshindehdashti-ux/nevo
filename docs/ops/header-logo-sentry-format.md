# Header Logo — Sentry Breadcrumb & Fallback-Chain Format

Reference for QA and developers debugging sticky header-logo breaks.
All shapes below are produced by `src/lib/sentry-forwarder.server.ts` and
are stable across releases; anything deviating from this doc is a bug.

---

## 1. The correlationId

A single `correlationId` (UUID-ish string) is minted per **page load** on
the client and stamped on every `header.logo.render` / `header.logo.error`
event that page load emits. This is the primary key you use to reassemble
one user's fallback chain across Sentry, `header_logo_events`, and
`/api/public/client-log` server logs.

Where it appears in a Sentry event (all values MUST be identical):

| Location                   | Field                                 | When missing       |
| -------------------------- | ------------------------------------- | ------------------ |
| Tag                        | `tags.correlation_id`                 | `null`             |
| Context                    | `contexts.logo.correlationId`         | `null`             |
| Extra                      | `extra.correlationId`                 | `undefined`        |
| User                       | `user.id`                             | `user` omitted     |
| Fingerprint (last segment) | `fingerprint[3]`                      | `"no-cid"`         |
| Message                    | `message.formatted` → `cid=<id>`      | `cid=-`            |
| Every breadcrumb           | `data.correlationId` + message prefix | `null` + `[cid:-]` |

Unit test: `src/lib/__tests__/sentry-forwarder-correlation.test.ts`.

---

## 2. Breadcrumb format

Each Sentry event ships with a `breadcrumbs.values` array reconstructing
the fallback timeline for that `correlationId`. The array is built from
the DB history (`public.header_logo_events` ordered by `client_ts`), plus
a final tail crumb for the failure that triggered the event.

### 2.1 Message shape

Every breadcrumb message uses this exact shape — no exceptions:

```
[cid:<correlationId-or-dash>] <kind>:<stage>
```

- `<correlationId-or-dash>` — the shared cid, or `-` if none was provided
  (do NOT invent one).
- `<kind>` — one of:
  - `render` — a `header.logo.render` event (successful paint of a variant)
  - `fail` — a `header.logo.error` event (a stage failed to load)
- `<stage>` — the pipeline stage identifier. Stable set:
  - `primary-light-png` — bundled PNG (initial paint)
  - `fallback-cdn-full` — CDN-hosted full logo
  - `fallback-inline-svg` — inline SVG data URI (terminal fallback)
  - `unknown` — placeholder only when the client omitted `stage`
    (should never happen in a healthy build)

Examples (real cid `4f2c9`):

```
[cid:4f2c9] render:fallback-inline-svg     ← terminal render
[cid:4f2c9] fail:primary-light-png         ← primary raster failed
[cid:4f2c9] fail:fallback-cdn-full         ← CDN raster failed
[cid:4f2c9] fail:fallback-inline-svg       ← terminal SVG failed (P1)
[cid:-]     fail:primary-light-png         ← cid was missing at emit time
```

### 2.2 Full breadcrumb object

```jsonc
{
  "type": "default",
  "category": "header.logo.error" | "header.logo.render",
  "level":    "warning" | "error" | "info",
  //  error   → "warning"   (non-terminal)
  //  error   → "error"     (terminal)
  //  render  → "info"
  "timestamp": 1735900800.123,        // epoch seconds from client_ts
  "message":   "[cid:4f2c9] fail:fallback-cdn-full",
  "data": {
    "correlationId": "4f2c9",         // MUST equal event cid (or null)
    "variant":       "light" | "dark" | null,
    "src":           "<failed url>",  // resolved src the browser tried
    "nextSrc":       "<next url>",    // what the fallback chain fell through to
    "online":        true | false | null
  }
}
```

### 2.3 Ordering and deduping rules

- Breadcrumbs are ordered **oldest → newest** (matches Sentry's UI).
- The **tail** crumb (the failure the current Sentry event describes) is
  always present. If the DB history already contains a row that matches the
  tail (same `category` + `message` + timestamp within 1ms), it is NOT
  duplicated — the forwarder detects the duplicate and skips it.
- The tail crumb's `level` reflects the terminal flag:
  - `terminal === true` → `level: "error"`
  - `terminal === false` → `level: "warning"`

Implementation: `buildBreadcrumbs()` in `sentry-forwarder.server.ts`
(lines 99–149).

---

## 3. Fallback-chain string

The `fallback_chain` tag AND `contexts.logo.fallbackChain` are a single
human-readable string summarising the whole chain up to (and including)
the current failure. Same string, two locations.

### 3.1 Grammar

```
<segment> (" → " <segment>)*
<segment> ::= ("render" | "fail") ":" <stage>
```

- Same `<kind>` and `<stage>` vocab as breadcrumb messages.
- Separator is a **U+2192 RIGHTWARDS ARROW** surrounded by single spaces:
  `" → "` (literally three code points: space, `→`, space). Never `->`.
- The last segment is ALWAYS the failure the event describes; if the DB
  history's last row already matches that segment, it is not repeated.

### 3.2 Canonical examples

| Scenario                                            | fallback_chain                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Only primary failed                                 | `fail:primary-light-png`                                                       |
| Primary → CDN both failed                           | `fail:primary-light-png → fail:fallback-cdn-full`                              |
| Full cascade to terminal SVG failure                | `fail:primary-light-png → fail:fallback-cdn-full → fail:fallback-inline-svg`   |
| Render succeeded on SVG fallback after two failures | `fail:primary-light-png → fail:fallback-cdn-full → render:fallback-inline-svg` |

### 3.3 Where it's used

- `tags.fallback_chain` — Sentry issue tag, filterable in the search bar.
- `tags.chain_length` — string count of segments (`history.length + 1`).
- `contexts.logo.fallbackChain` — same string, exposed on the issue's
  "Logo" context card.
- `message.formatted` — appended after `cid=…` so the issue title in the
  Sentry UI shows the whole chain at a glance:

  ```
  header.logo.error [fallback-inline-svg] · terminal · cid=4f2c9 · fail:primary-light-png → fail:fallback-cdn-full → fail:fallback-inline-svg
  ```

- `fingerprint` — the second-to-last segment of the fingerprint array is
  `fallbackChain`, so different cascades group into different Sentry
  issues even for the same terminal stage:

  ```
  fingerprint: ["header.logo.error", "<stage>", "<fallback_chain>", "<cid|no-cid>"]
  ```

Implementation: `buildFallbackChain()` in `sentry-forwarder.server.ts`
(lines 152–162).

---

## 4. Debugging playbook — sticky logo break

1. **Find the correlationId** in Sentry via the issue → Tag "correlation_id"
   (or copy the `cid=…` from the message).
2. **Read the full timeline** on the issue's breadcrumbs panel. Every row
   is prefixed `[cid:<id>]`; if any row shows `[cid:-]` it means the
   client failed to attach the cid at emit time — file a bug against
   `src/components/site/SiteHeader.tsx`.
3. **Cross-reference the DB**:
   ```sql
   select event_type, stage, variant, src, next_src, client_ts
   from public.header_logo_events
   where correlation_id = '<cid>'
   order by client_ts asc;
   ```
   Row count MUST equal breadcrumb count. If DB has more rows than
   breadcrumbs, the forwarder truncated (`.limit(200)`) — reduce the
   window or re-open the ticket with the raw rows.
4. **Filter more of the same** in Sentry:
   - `tags.stage:fallback-inline-svg tags.terminal:true` — all P1 SVG
     failures.
   - `tags.fallback_chain:"fail:primary-light-png → fail:fallback-cdn-full → fail:fallback-inline-svg"`
     — the exact cascade.
   - `tags.chain_length:>=3` — anything that reached the last hop.
5. **Reproduce locally** with the QA debug log
   (see `docs/content/README.md` §17 and
   `src/lib/logo-telemetry-debug.ts`):
   ```js
   __nevoLogoDebug.enable(); // in devtools
   // reload; [nevo:logo-telemetry] lines show the sampling decision for
   // every stage — same `stage` values as the Sentry breadcrumbs above.
   ```

---

## 5. Invariants (contract summary)

- The `[cid:…]` prefix is on **every** breadcrumb message. Missing cid
  renders as literal `[cid:-]`; never `[cid:undefined]`, `[cid:null]`,
  or an empty bracket.
- Breadcrumb `data.correlationId` is either the same string as the event
  cid or `null`. Never `undefined`, never a stringified `"null"`.
- `fallback_chain` uses `" → "` (arrow) as separator. Do not accept ASCII
  `->` in filters — the tag will not match.
- The last segment of `fingerprint` is the cid, or the literal string
  `"no-cid"` when none is present, so per-page-load grouping stays stable.

Any change to the above is a breaking change — update this doc, the
`sentry-forwarder-correlation.test.ts` assertions, and the Sentry alert
presets under `ops/sentry/alerts/` in the same PR.
