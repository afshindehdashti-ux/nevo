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

/**
 * Violation categories drive the per-file grouped drift report at the end.
 * Keep these stable — CI log parsers key off them.
 */
const CATEGORIES = {
  RAW_EMIT: "raw-emit",
  MISSING_RESOURCE: "missing-resource",
  INVALID_RESOURCE: "invalid-resource",
  DYNAMIC_RESOURCE: "dynamic-resource",
  INVALID_REASON: "invalid-reason",
};

const CATEGORY_LABEL = {
  [CATEGORIES.RAW_EMIT]: "Raw admin_list_empty_shown emission",
  [CATEGORIES.MISSING_RESOURCE]: "Missing `resource` prop",
  [CATEGORIES.INVALID_RESOURCE]: "Invalid `resource` slug",
  [CATEGORIES.DYNAMIC_RESOURCE]: "Dynamic `resource` prop (needs annotation)",
  [CATEGORIES.INVALID_REASON]: "Invalid `reason` value",
};

const violations = [];
function fail(file, line, category, message) {
  violations.push({ file, line, category, message });
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
        CATEGORIES.RAW_EMIT,
        `Direct logClientEvent("admin_list_empty_shown", …) call. Route it through <ListEmptyState resource="…" /> so slug + reason validation runs.`,
      );
    }
  }

  // Rules 2 & 3: every <ListEmptyState …> and <AdminListPage …> usage.
  const tagRe = /<(ListEmptyState|AdminListPage)\b([^>]*?)(\/?)>/gs;
  for (const m of src.matchAll(tagRe)) {
    const [full, tag, attrs] = m;
    if (rel === "src/components/admin/AdminListPage.tsx") continue;

    const openTag = attrs;
    const resource = extractAttr(openTag, "resource");
    const reason = extractAttr(openTag, "reason");
    const line = lineOf(src, m.index);

    if (!resource) {
      fail(
        rel,
        line,
        CATEGORIES.MISSING_RESOURCE,
        `<${tag}> has no \`resource\` prop.`,
      );
      continue;
    }
    if (resource.kind === "literal") {
      if (!APPROVED_RESOURCES.has(resource.value)) {
        fail(
          rel,
          line,
          CATEGORIES.INVALID_RESOURCE,
          `<${tag} resource="${resource.value}"> — slug not in ADMIN_LIST_RESOURCES.`,
        );
      }
    } else if (!full.includes("admin-list-telemetry: dynamic-resource")) {
      fail(
        rel,
        line,
        CATEGORIES.DYNAMIC_RESOURCE,
        `<${tag} resource={${resource.value}}> — non-literal slug without the \`admin-list-telemetry: dynamic-resource\` annotation.`,
      );
    }

    if (reason && reason.kind === "literal" && !APPROVED_REASONS.has(reason.value)) {
      fail(
        rel,
        line,
        CATEGORIES.INVALID_REASON,
        `<${tag} reason="${reason.value}"> — reason not in ADMIN_LIST_EMPTY_REASONS.`,
      );
    }
  }
}

const RESOURCE_LIST = [...APPROVED_RESOURCES].sort();
const REASON_LIST = [...APPROVED_REASONS].sort();

if (violations.length > 0) {
  const byFile = new Map();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file).push(v);
  }

  const totalFiles = byFile.size;
  const byCategoryCount = violations.reduce((acc, v) => {
    acc[v.category] = (acc[v.category] || 0) + 1;
    return acc;
  }, {});

  console.error("");
  console.error("═══════════════════════════════════════════════════════════════");
  console.error(" admin-list telemetry drift detected");
  console.error("═══════════════════════════════════════════════════════════════");
  console.error(
    ` ${violations.length} violation(s) across ${totalFiles} file(s)`,
  );
  console.error("");
  console.error(" Breakdown by category:");
  for (const [cat, label] of Object.entries(CATEGORY_LABEL)) {
    const n = byCategoryCount[cat] || 0;
    if (n > 0) console.error(`   • ${label.padEnd(48)} ${n}`);
  }
  console.error("");
  console.error(" Approved resource slugs (ADMIN_LIST_RESOURCES):");
  for (const r of RESOURCE_LIST) console.error(`   - ${r}`);
  console.error("");
  console.error(" Approved empty reasons (ADMIN_LIST_EMPTY_REASONS):");
  for (const r of REASON_LIST) console.error(`   - ${r}`);
  console.error("");
  console.error("───────────────────────────────────────────────────────────────");
  console.error(" Per-file drift report");
  console.error("───────────────────────────────────────────────────────────────");

  const sortedFiles = [...byFile.keys()].sort();
  for (const file of sortedFiles) {
    const items = byFile.get(file).sort((a, b) => a.line - b.line);
    console.error("");
    console.error(`▸ ${file}  (${items.length} violation${items.length === 1 ? "" : "s"})`);
    for (const v of items) {
      console.error(`    line ${v.line}  [${v.category}]  ${v.message}`);
    }
  }

  console.error("");
  console.error("───────────────────────────────────────────────────────────────");
  console.error(" How to fix");
  console.error("───────────────────────────────────────────────────────────────");
  console.error(" • missing-resource / invalid-resource:");
  console.error("     Pass one of the approved slugs above. To add a new one,");
  console.error("     append it to ADMIN_LIST_RESOURCES in");
  console.error("     src/components/admin/list-telemetry.ts first.");
  console.error(" • invalid-reason:");
  console.error("     Use one of the approved reasons above (or omit the prop");
  console.error("     to default to \"no_records\").");
  console.error(" • dynamic-resource:");
  console.error("     Prefer a string literal. If the value is genuinely");
  console.error("     computed, add {/* admin-list-telemetry: dynamic-resource */}");
  console.error("     on the same tag to acknowledge the risk.");
  console.error(" • raw-emit:");
  console.error("     Render <ListEmptyState resource=\"…\" /> instead of calling");
  console.error("     logClientEvent(\"admin_list_empty_shown\", …) directly.");
  console.error("");
  console.error(" See docs/admin-list-states.md → \"admin_list_empty_shown checklist\".");
  console.error("");
  process.exit(1);
}

console.log(
  `✓ admin-list telemetry: ${files.length} files scanned — no drift.`,
);
console.log(
  `  Approved resources (${RESOURCE_LIST.length}): ${RESOURCE_LIST.join(", ")}`,
);
console.log(
  `  Approved reasons   (${REASON_LIST.length}): ${REASON_LIST.join(", ")}`,
);

