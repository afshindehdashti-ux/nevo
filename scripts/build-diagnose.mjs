#!/usr/bin/env node
/**
 * Wrapper around `vite build` that surfaces the exact failing file/module
 * when the build fails. On success, prints a short summary. On failure,
 * re-prints only the error-relevant lines with surrounding context and a
 * best-effort "offender" summary (file path + import specifier).
 *
 * Usage:
 *   node scripts/build-diagnose.mjs [--mode development] [-- extra vite args]
 */
import { spawn } from "node:child_process";
import { relative } from "node:path";

const args = process.argv.slice(2);
const mode =
  args.includes("--mode")
    ? args[args.indexOf("--mode") + 1]
    : "development";
const passthrough = args.filter((a, i, arr) => {
  if (a === "--mode") return false;
  if (arr[i - 1] === "--mode") return false;
  return true;
});

const viteArgs = ["vite", "build", "--mode", mode, ...passthrough];
console.log(`\n▶ ${viteArgs.join(" ")}\n`);

const child = spawn("bunx", viteArgs, {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let stdoutBuf = "";
let stderrBuf = "";

child.stdout.on("data", (d) => {
  const s = d.toString();
  stdoutBuf += s;
  process.stdout.write(s);
});
child.stderr.on("data", (d) => {
  const s = d.toString();
  stderrBuf += s;
  process.stderr.write(s);
});

child.on("close", (code) => {
  if (code === 0) {
    console.log(`\n✅ build:dev succeeded (mode=${mode})`);
    process.exit(0);
  }

  const combined = `${stdoutBuf}\n${stderrBuf}`;
  const lines = combined.split(/\r?\n/);

  // Patterns that reliably mark the offending file/module in a Vite/Rollup build.
  const errorPatterns = [
    /Failed to resolve import/i,
    /Could not resolve/i,
    /Cannot find module/i,
    /Rollup failed to resolve/i,
    /Transform failed/i,
    /\[plugin[^\]]*\] .*error/i,
    /ENOENT/i,
    /SyntaxError/i,
    /Unexpected token/i,
    /is not exported by/i,
    /error during build/i,
    /^\s*error\b/i,
    /^\s*✘/,
  ];

  // Collect error lines with ±3 lines of context.
  const hits = new Set();
  lines.forEach((ln, i) => {
    if (errorPatterns.some((rx) => rx.test(ln))) {
      for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 6); j++) {
        hits.add(j);
      }
    }
  });

  console.error("\n────────────────────────────────────────────────────────");
  console.error(`❌ build:dev failed (exit ${code}) — mode=${mode}`);
  console.error("────────────────────────────────────────────────────────");

  if (hits.size > 0) {
    console.error("\n🔎 Error context (filtered from build output):\n");
    [...hits].sort((a, b) => a - b).forEach((i) => {
      console.error(`  ${String(i + 1).padStart(5)} │ ${lines[i]}`);
    });
  } else {
    console.error(
      "\n(No obvious error pattern matched — showing last 40 lines of build output.)\n",
    );
    console.error(lines.slice(-40).map((l) => `  │ ${l}`).join("\n"));
  }

  // Best-effort offender extraction.
  const offenders = new Set();
  const fileRx =
    /(?:from\s+|import(?:ed)?\s+(?:from\s+)?|in\s+|at\s+|File:\s*|Location:\s*)?["']?((?:\.{0,2}\/|@\/|src\/|\/)[^\s"'`)]+\.(?:tsx?|jsx?|mjs|cjs|css|scss|json|png|jpe?g|gif|webp|svg|woff2?|ttf|otf))["']?/gi;
  for (const ln of lines) {
    if (!errorPatterns.some((rx) => rx.test(ln))) continue;
    let m;
    while ((m = fileRx.exec(ln)) !== null) {
      offenders.add(m[1]);
    }
  }

  const importRx = /(?:resolve import\s+|Cannot find module\s+)["']([^"']+)["']/gi;
  const importSpecs = new Set();
  for (const ln of lines) {
    let m;
    while ((m = importRx.exec(ln)) !== null) {
      importSpecs.add(m[1]);
    }
  }

  if (offenders.size || importSpecs.size) {
    console.error("\n📍 Likely offender(s):");
    for (const f of offenders) {
      console.error(`   • file: ${relative(process.cwd(), f) || f}`);
    }
    for (const s of importSpecs) {
      console.error(`   • unresolved import: ${s}`);
    }
  }

  console.error("\n💡 Next steps:");
  console.error("   1. Open the file above and verify the import path exists.");
  console.error("   2. For missing packages, run: bun add <package>");
  console.error("   3. For missing local files, create the file or fix the path.");
  console.error("   4. Re-run: bun run build:dev:diagnose\n");

  process.exit(code ?? 1);
});
