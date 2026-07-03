/**
 * Versioned payload envelope for `header.logo.render` / `header.logo.error`
 * client events.
 *
 * Downstream log parsers (the /api/public/client-log sink, the admin dashboard,
 * ad-hoc log queries) key off `schema` + `schemaVersion` to stay stable as
 * fields evolve. Every producer MUST wrap its payload with
 * `withLogoEventSchema(...)` — never emit a raw object.
 *
 * Versioning rules (semver-style, integer major):
 *  - Additive changes (new optional fields): keep the same version.
 *  - Renamed / removed / semantically changed fields: BUMP the version and
 *    document the change below.
 *  - Consumers should treat unknown fields as forward-compatible extras and
 *    only reject events whose `schemaVersion` is strictly greater than the
 *    highest version they know how to parse.
 *
 * History
 *  v1 (2026-07): initial schema.
 *        render: correlationId, variant, sampleRate, naturalWidth,
 *                naturalHeight, viewportWidth, viewportHeight, dpr, src
 *        error:  correlationId, stage, failedSrc, nextSrc?, viewportWidth?,
 *                online?, terminal?
 */

export const HEADER_LOGO_EVENT_SCHEMA = "header.logo.event" as const;
export const HEADER_LOGO_EVENT_SCHEMA_VERSION = 1 as const;

export type HeaderLogoEventEnvelope<T extends Record<string, unknown>> = T & {
  schema: typeof HEADER_LOGO_EVENT_SCHEMA;
  schemaVersion: typeof HEADER_LOGO_EVENT_SCHEMA_VERSION;
};

/**
 * Wraps a logo event payload with the versioned schema envelope. Existing
 * `schema` / `schemaVersion` fields on the payload are ignored — the
 * envelope always wins so producers cannot accidentally emit a stale version.
 */
export function withLogoEventSchema<T extends Record<string, unknown>>(
  payload: T,
): HeaderLogoEventEnvelope<T> {
  return {
    ...payload,
    schema: HEADER_LOGO_EVENT_SCHEMA,
    schemaVersion: HEADER_LOGO_EVENT_SCHEMA_VERSION,
  };
}
