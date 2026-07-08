#!/usr/bin/env node
/**
 * CI guard: admin list telemetry contract.
 *
 * Enforces the rules documented in `docs/admin-list-states.md`:
 *
 *   1. The ONLY module allowed to call
 *      `logClientEvent("admin_list_empty_shown", …)` is
 *      `src/components/admin/ListEmptyState.tsx`. Every other emitter has
 *      to route through that shared component so telemetry, dedup, and
 *      copy stay consistent.
 *
 *   2. Every `<ListEmptyState …>` and `<AdminListPage …>` usage outside
 *      tests/stories MUST pass a `resource=` prop, and its value MUST be
 *      one of `ADMIN_LIST_RESOURCES` (parsed live from
 *      `src/components/admin/list-telemetry.ts` — the single source of
 *      truth).
 *
 *   3. When a `reason=` prop is present, its value MUST be one of
 *      `ADMIN_LIST_EMPTY_REASONS`.
 *
 * TypeScript already catches typos now that the props are typed, but this
 * script is the belt-and-suspenders check for:
 *   - non-TS emitters (raw `logClientEvent` calls anywhere in the tree)
 *   - dynamic `resource={someVar}` where a stale prop can slip past the
 *     union (we flag any non-literal resource so it must be justified via
 *     an allowlist comment)
 *   - future tools/scripts that hand-craft the event payload
 *
 * Run:  node scripts/check-admin-list-telemetry.mjs
 * CI:   .github/workflows/check-admin-list-telemetry.yml
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TELEMETRY_FILE = join(REPO, "src/components/admin/list-telemetry.ts");
const EMPTY_STATE_FILE = "src/components/admin/ListEmptyState.tsx";

/** Parse an `as const` string tuple from list-telemetry.ts. */
function parseConstTuple(source, exportName) {
  const re = new RegExp(
    `export\\s+const\\s+${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as\\s+const`,
    "m",
  );
  const match = source.match(re);
  if (!match) {
    throw new Error(`Could not find export const ${exportName} in list-telemetry.ts`);
  }
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const telemetrySource = readFileSync(TELEMETRY_FILE, "utf8");
const APPROVED_RESOURCES = new Set(parseConstTuple(telemetrySource, "ADMIN_LIST_RESOURCES"));
const APPROVED_REASONS = new Set(parseConstTuple(telemetrySource, "ADMIN_LIST_EMPTY_REASONS"));

const violations = [];
function fail(file, line, message) {
  violations.push({ file, line, message });
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

/** Extract a JSX attribute value snippet for `<Tag …attr=… …>` opening blocks. */
function extractAttr(openTag, attr) {
  // attr="literal"  |  attr={expr}
  const literal = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`).exec(openTag);
  if (literal) return { kind: "literal", value: literal[1] };
  const expr = new RegExp(`\\b${attr}\\s*=\\s*\\{([^}]*)\\}`).exec(openTag);
  if (expr) return { kind: "expr", value: expr[1].trim() };
  return null;
}

const files = globSync("src/**/*.{ts,tsx}", { cwd: REPO }).filter(
  (f) =>
    !f.includes("/__tests__/") &&
    !f.endsWith(".test.ts") &&
    !f.endsWith(".test.tsx") &&
    !f.endsWith(".stories.tsx"),
);

for (const rel of files) {
  const abs = join(REPO, rel);
  const src = readFileSync(abs, "utf8");

  // Rule 1: raw logClientEvent("admin_list_empty_shown", …) is only allowed
  // inside ListEmptyState.tsx. Anything else is a drift risk.
  const rawRe = /logClientEvent\s*\(\s*["']admin_list_empty_shown["']/g;
  for (const m of src.matchAll(rawRe)) {
    if (rel !== EMPTY_STATE_FILE) {
      fail(
        rel,
        lineOf(src, m.index),
        `Raw admin_list_empty_shown emission outside ${EMPTY_STATE_FILE}. Route it through <ListEmptyState resource="…" /> so slug + reason validation runs.`,
      );
    }
  }

  // Rules 2 & 3: every <ListEmptyState …> and <AdminListPage …> usage.
  const tagRe = /<(ListEmptyState|AdminListPage)\b([^>]*?)(\/?)>/gs;
  for (const m of src.matchAll(tagRe)) {
    const [full, tag, attrs] = m;
    // AdminListPage.tsx itself defines the shared implementation and calls
    // <ListEmptyState … resource={resource} … />; the type system already
    // enforces the union there, and the runtime hop makes literal parsing
    // impossible. Skip.
    if (rel === "src/components/admin/AdminListPage.tsx") continue;

    const openTag = attrs;
    const resource = extractAttr(openTag, "resource");
    const reason = extractAttr(openTag, "reason");
    const line = lineOf(src, m.index);

    if (!resource) {
      fail(
        rel,
        line,
        `<${tag}> is missing the required \`resource\` prop. Add one from ADMIN_LIST_RESOURCES so admin_list_empty_shown fires.`,
      );
      continue;
    }
    if (resource.kind === "literal") {
      if (!APPROVED_RESOURCES.has(resource.value)) {
        fail(
          rel,
          line,
          `<${tag} resource="${resource.value}"> is not in ADMIN_LIST_RESOURCES. Approved: ${[...APPROVED_RESOURCES].join(", ")}.`,
        );
      }
    } else {
      // Dynamic resource — allow only when the file annotates why. Look
      // for `// admin-list-telemetry: dynamic-resource` on the same tag.
      if (!full.includes("admin-list-telemetry: dynamic-resource")) {
        fail(
          rel,
          line,
          `<${tag} resource={${resource.value}}> uses a non-literal slug. Either inline a literal from ADMIN_LIST_RESOURCES or add \`{/* admin-list-telemetry: dynamic-resource */}\` on the same tag to acknowledge the risk.`,
        );
      }
    }

    if (reason && reason.kind === "literal" && !APPROVED_REASONS.has(reason.value)) {
      fail(
        rel,
        line,
        `<${tag} reason="${reason.value}"> is not in ADMIN_LIST_EMPTY_REASONS. Approved: ${[...APPROVED_REASONS].join(", ")}.`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\n✗ admin-list telemetry check failed with ${violations.length} violation(s):\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.message}`);
  }
  console.error(
    `\nSee docs/admin-list-states.md → "admin_list_empty_shown checklist".`,
  );
  process.exit(1);
}

console.log(
  `✓ admin-list telemetry: ${files.length} files scanned, ${APPROVED_RESOURCES.size} approved resources, ${APPROVED_REASONS.size} approved reasons — no violations.`,
);
