#!/usr/bin/env node
/**
 * CI guard: forbid direct reads of finance-column shortcuts
 * (balance / balance_due / paid_amount / amount_paid / grand_total)
 * in read/display code paths.
 *
 * Reads MUST go through helpers in src/lib/finance-normalization.ts
 * (financeBalanceDue / financePaidAmount / financeTotalAmount) so
 * that fallback columns and coercion stay consistent everywhere.
 *
 * Write/output contracts (Supabase .select / .update / .insert /
 * .eq / .order strings, generated types, backend QA integrity
 * suites) are allow-listed either by file or by the appearance of
 * the token inside a query-builder call on the same line.
 *
 * Escape hatch: append `// finance-allow` on a line to skip it.
 *
 * Run: `node scripts/check-finance-normalization.mjs`
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SRC = "src";

const ALLOW_FILES = new Set(
  [
    // The helpers themselves.
    "src/lib/finance-normalization.ts",
    // Generated Supabase types.
    "src/integrations/supabase/types.ts",
    // Backend integrity / QA suites that assert directly on the
    // stored column values as the ground truth.
    "src/components/crm/SystemHealthPage.tsx",
    "src/lib/erp-qa.functions.ts",
  ].map(normalize),
);

const ALLOW_DIR_PREFIXES = [
  "src/lib/__tests__",
  "src/components/exports/__tests__",
  "src/components/admin/__tests__",
  "src/routes/__tests__",
  "src/routes/_authenticated/__tests__",
].map(normalize);

// Local variable names that legitimately expose these fields — e.g. the
// { total, balance, ... } object returned by `computeInvoiceTotals`.
const ALLOW_IDENTIFIERS = new Set(["totals", "computed", "computedTotals"]);

// Fields we forbid as direct dotted reads on finance rows.
const FIELDS = [
  "balance",
  "balance_due",
  "paid_amount",
  "amount_paid",
  "grand_total",
];

const ACCESS_RE = new RegExp(
  `\\b([A-Za-z_$][\\w$]*)\\.(?:${FIELDS.join("|")})\\b`,
  "g",
);

// Query-builder calls whose arguments legitimately name columns.
const QUERY_BUILDER_RE =
  /\.(select|order|eq|neq|gt|gte|lt|lte|in|match|update|insert|upsert|contains|containedBy|filter|is)\s*\(/;

// Property/interface declarations: `field: type` or `field?: type`.
const DECL_RE = new RegExp(
  `^\\s*(?:${FIELDS.join("|")})\\s*\\??\\s*:`,
);

function normalize(p) {
  return p.split("/").join(sep);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p);
  }
  return out;
}

function isAllowedFile(relPath) {
  if (ALLOW_FILES.has(relPath)) return true;
  if (/\.test\.(ts|tsx)$/.test(relPath)) return true;
  for (const prefix of ALLOW_DIR_PREFIXES) {
    if (relPath.startsWith(prefix + sep) || relPath === prefix) return true;
  }
  return false;
}

const files = walk(join(ROOT, SRC));
const issues = [];

for (const f of files) {
  const rel = relative(ROOT, f);
  if (isAllowedFile(rel)) continue;
  const src = readFileSync(f, "utf8");
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (raw.includes("finance-allow")) continue;

    // Strip line/block comments so we don't flag prose.
    const codeOnly = raw.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
    if (!codeOnly.trim()) continue;

    // Skip TypeScript interface / type field declarations.
    if (DECL_RE.test(codeOnly)) continue;

    // Skip Supabase query-builder lines — their string args name columns.
    if (QUERY_BUILDER_RE.test(codeOnly)) continue;

    for (const m of codeOnly.matchAll(ACCESS_RE)) {
      const ident = m[1];
      if (ALLOW_IDENTIFIERS.has(ident)) continue;
      issues.push({ file: rel, line: i + 1, text: raw.trim() });
      break;
    }
  }
}

if (issues.length) {
  console.error(
    `\n✖ Disallowed direct finance-column reads (${issues.length}).`,
  );
  console.error(
    "  Use financeBalanceDue / financePaidAmount / financeTotalAmount from",
  );
  console.error(
    "  src/lib/finance-normalization.ts, or add `// finance-allow` if the",
  );
  console.error("  usage is genuinely a write/schema contract.\n");
  for (const it of issues) {
    console.error(`  ${it.file}:${it.line}: ${it.text}`);
  }
  process.exit(1);
}

console.log("✓ finance-normalization: no disallowed reads");

// Prevent bundlers from treating this as a module with side-effects only.
void fileURLToPath;
