#!/usr/bin/env node
/**
 * i18n coverage report
 *
 * Scans every locale JSON in src/i18n/locales and every t("...") / i18n.t("...")
 * usage across src/ to flag:
 *   - MISSING   : keys used in code but absent from a locale
 *   - EXTRA     : keys defined in a locale but never referenced in code (unused)
 *   - DUPLICATE : keys defined more than once inside a locale file (raw JSON scan)
 *   - DRIFT     : keys present in EN but missing from other locales (or vice versa)
 *
 * Exit codes:
 *   0  OK (or only warnings when --warn-only)
 *   1  Violations found and strict mode active
 *
 * Flags:
 *   --json          Emit machine-readable JSON to stdout
 *   --warn-only     Never exit non-zero (report only)
 *   --base=en       Base locale for drift comparison (default: en)
 *   --ignore-unused Skip "extra / unused" reporting
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const LOCALES_DIR = join(ROOT, "src/i18n/locales");
const SRC_DIR = join(ROOT, "src");

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const warnOnly = args.has("--warn-only");
const ignoreUnused = args.has("--ignore-unused");
const baseArg = [...args].find((a) => a.startsWith("--base="));
const BASE = baseArg ? baseArg.split("=")[1] : "en";

// ---------- helpers ----------

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?|mts|cts)$/.test(extname(p))) {
      out.push(p);
    }
  }
  return out;
}

function flatten(obj, prefix = "", out = new Set()) {
  if (obj === null || typeof obj !== "object") {
    out.add(prefix);
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    flatten(v, next, out);
  }
  return out;
}

// Find duplicate keys inside a raw JSON string (JSON.parse silently keeps last).
function findDuplicateKeys(raw) {
  const dupes = [];
  const stack = [{ keys: new Set(), path: "" }];
  const tokens = raw.matchAll(/"((?:[^"\\]|\\.)*)"\s*(:)?|([{}\[\]])/g);
  let expectingKey = true;
  for (const m of tokens) {
    const [, str, colon, brace] = m;
    if (brace) {
      if (brace === "{") {
        stack.push({ keys: new Set(), path: stack[stack.length - 1].path });
        expectingKey = true;
      } else if (brace === "}") {
        stack.pop();
        expectingKey = false;
      } else if (brace === "[") {
        expectingKey = false;
      } else if (brace === "]") {
        expectingKey = false;
      }
    } else if (str !== undefined) {
      if (colon && expectingKey) {
        const frame = stack[stack.length - 1];
        if (frame.keys.has(str)) dupes.push(str);
        else frame.keys.add(str);
        expectingKey = false;
      } else {
        expectingKey = true;
      }
    }
  }
  return dupes;
}

// Extract static t("key") / i18n.t("key") / t('key') usages. Dynamic t(var)
// calls are recorded as "prefix.*" so the checker skips descendants.
const T_CALL = /(?<![A-Za-z0-9_$])(?:i18n\.)?t\(\s*(["'])([^"'\n]+)\1/g;
// Template-literal call: t(`prefix.${x}.suffix`) — treat as dynamic prefix.
const T_TEMPLATE = /(?<![A-Za-z0-9_$])(?:i18n\.)?t\(\s*`([^`]*)`/g;
const DYNAMIC_T = /(?<![A-Za-z0-9_$])(?:i18n\.)?t\(\s*(?!["'`])[A-Za-z_$]/g;

function extractUsages(files) {
  const staticKeys = new Set();
  const dynamicPrefixes = new Set();
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(T_CALL)) staticKeys.add(m[2]);
    // t(`prefix.${x}.suffix`) — record longest static prefix as dynamic.
    for (const m of src.matchAll(T_TEMPLATE)) {
      const tpl = m[1];
      const idx = tpl.indexOf("${");
      const prefix = (idx === -1 ? tpl : tpl.slice(0, idx)).replace(/\.$/, "");
      if (prefix) dynamicPrefixes.add(prefix);
      else dynamicPrefixes.add("*");
    }
    // t(someVariable) — completely dynamic; widen to wildcard.
    if (DYNAMIC_T.test(src)) dynamicPrefixes.add("*");
  }
  return { staticKeys, dynamicPrefixes };
}

function isCoveredByDynamic(key, dynamicPrefixes) {
  if (dynamicPrefixes.has("*")) return true;
  for (const p of dynamicPrefixes) if (key === p || key.startsWith(p + ".")) return true;
  return false;
}

// ---------- run ----------

const localeFiles = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort();

const locales = {};
const duplicates = {};
for (const f of localeFiles) {
  const code = f.replace(/\.json$/, "");
  const raw = readFileSync(join(LOCALES_DIR, f), "utf8");
  const parsed = JSON.parse(raw);
  locales[code] = flatten(parsed);
  const dupes = findDuplicateKeys(raw);
  if (dupes.length) duplicates[code] = dupes;
}

if (!locales[BASE]) {
  console.error(`i18n-coverage: base locale "${BASE}" not found in ${LOCALES_DIR}`);
  process.exit(2);
}

const sourceFiles = walk(SRC_DIR);
const { staticKeys, dynamicPrefixes } = extractUsages(sourceFiles);

const baseKeys = locales[BASE];

const report = {
  base: BASE,
  totals: {
    sourceFiles: sourceFiles.length,
    staticUsages: staticKeys.size,
    dynamicPrefixes: [...dynamicPrefixes],
  },
  locales: {},
  duplicates,
};

let hasErrors = false;

for (const [code, keys] of Object.entries(locales)) {
  // Missing = used in code but absent from this locale
  const missing = [];
  for (const k of staticKeys) if (!keys.has(k)) missing.push(k);

  // Extra = defined in this locale but never referenced (and not covered by dynamic prefix)
  const extra = [];
  if (!ignoreUnused) {
    for (const k of keys) {
      if (staticKeys.has(k)) continue;
      if (isCoveredByDynamic(k, dynamicPrefixes)) continue;
      extra.push(k);
    }
  }

  // Drift vs base locale
  const missingVsBase = [];
  const onlyInThis = [];
  if (code !== BASE) {
    for (const k of baseKeys) if (!keys.has(k)) missingVsBase.push(k);
    for (const k of keys) if (!baseKeys.has(k)) onlyInThis.push(k);
  }

  report.locales[code] = {
    total: keys.size,
    missing: missing.sort(),
    extra: extra.sort(),
    missingVsBase: missingVsBase.sort(),
    onlyInThis: onlyInThis.sort(),
    duplicates: duplicates[code] ?? [],
  };

  if (
    missing.length ||
    (duplicates[code]?.length ?? 0) ||
    missingVsBase.length ||
    onlyInThis.length
  ) {
    hasErrors = true;
  }
}

if (asJson) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  const bold = (s) => `\x1b[1m${s}\x1b[0m`;
  const red = (s) => `\x1b[31m${s}\x1b[0m`;
  const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
  const green = (s) => `\x1b[32m${s}\x1b[0m`;
  const dim = (s) => `\x1b[2m${s}\x1b[0m`;

  console.log(bold(`\ni18n coverage report`));
  console.log(
    dim(
      `base=${BASE}  locales=${localeFiles.length}  source files=${sourceFiles.length}  static t() usages=${staticKeys.size}`,
    ),
  );
  if (dynamicPrefixes.size) {
    console.log(
      dim(
        `dynamic t() detected — unused-key check widened for: ${[...dynamicPrefixes].join(", ")}`,
      ),
    );
  }

  const preview = (arr, n = 10) =>
    arr.slice(0, n).map((k) => `    - ${k}`).join("\n") +
    (arr.length > n ? `\n    ${dim(`… +${arr.length - n} more`)}` : "");

  for (const [code, info] of Object.entries(report.locales)) {
    const flags = [];
    if (info.missing.length) flags.push(red(`${info.missing.length} missing`));
    if (info.duplicates.length) flags.push(red(`${info.duplicates.length} duplicate`));
    if (info.missingVsBase.length) flags.push(yellow(`${info.missingVsBase.length} vs ${BASE}`));
    if (info.onlyInThis.length) flags.push(yellow(`${info.onlyInThis.length} only-in-${code}`));
    if (info.extra.length) flags.push(dim(`${info.extra.length} unused`));

    const header = `${bold(code.padEnd(4))} ${dim(`(${info.total} keys)`)}  ${flags.length ? flags.join("  ") : green("ok")}`;
    console.log("\n" + header);

    if (info.missing.length) {
      console.log(red(`  MISSING (used in code, absent in ${code}):`));
      console.log(preview(info.missing));
    }
    if (info.duplicates.length) {
      console.log(red(`  DUPLICATE keys in ${code}.json:`));
      console.log(preview(info.duplicates));
    }
    if (info.missingVsBase.length) {
      console.log(yellow(`  DRIFT — in ${BASE} but missing from ${code}:`));
      console.log(preview(info.missingVsBase));
    }
    if (info.onlyInThis.length) {
      console.log(yellow(`  DRIFT — in ${code} but not in ${BASE}:`));
      console.log(preview(info.onlyInThis));
    }
    if (info.extra.length) {
      console.log(dim(`  UNUSED (defined in ${code} but no t() reference):`));
      console.log(preview(info.extra, 5));
    }
  }

  console.log("");
  if (hasErrors) {
    console.log(red(bold("i18n coverage: violations found.")));
  } else {
    console.log(green(bold("i18n coverage: clean.")));
  }
}

if (hasErrors && !warnOnly) process.exit(1);
