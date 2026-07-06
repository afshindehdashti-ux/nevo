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
const mode = args.includes("--mode") ? args[args.indexOf("--mode") + 1] : "development";
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
    [...hits]
      .sort((a, b) => a - b)
      .forEach((i) => {
        console.error(`  ${String(i + 1).padStart(5)} │ ${lines[i]}`);
      });
  } else {
    console.error(
      "\n(No obvious error pattern matched — showing last 40 lines of build output.)\n",
    );
    console.error(
      lines
        .slice(-40)
        .map((l) => `  │ ${l}`)
        .join("\n"),
    );
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

  // ─── GitHub Actions annotations ────────────────────────────────────────
  // Emit `::error file=<path>,line=<n>,col=<n>::<message>` so failures show
  // up inline on the PR "Files changed" tab and in the run summary.
  // See: https://docs.github.com/actions/reference/workflow-commands
  const annotations = new Map(); // key -> {file,line,col,message}
  const toRel = (p) => {
    try {
      const abs = p.startsWith("/") ? p : p;
      const rel = relative(process.cwd(), abs);
      return rel && !rel.startsWith("..") ? rel : p.replace(/^\/+/, "");
    } catch {
      return p;
    }
  };
  const escape = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  const push = (file, line, col, message) => {
    if (!file) return;
    const rel = toRel(file);
    // Only annotate files that live inside the repo (skip node_modules/dist).
    if (rel.startsWith("node_modules") || rel.startsWith("dist")) return;
    const key = `${rel}:${line ?? 0}:${col ?? 0}:${message}`;
    if (annotations.has(key)) return;
    annotations.set(key, { file: rel, line: line ?? 1, col: col ?? 1, message });
  };

  const FILE_CHARS = String.raw`[^\s"'\`():]+?\.(?:tsx?|jsx?|mjs|cjs|css|scss|json|html)`;

  // 1) "Failed to resolve import \"X\" from \"path/to/file.tsx\"."
  const failResolveRx = new RegExp(
    String.raw`Failed to resolve import\s+["']([^"']+)["']\s+from\s+["']([^"']+)["']`,
    "gi",
  );
  // 2) "Rollup failed to resolve import \"X\" from \"path/to/file.tsx\""
  const rollupResolveRx = new RegExp(
    String.raw`Rollup failed to resolve import\s+["']([^"']+)["']\s+from\s+["']([^"']+)["']`,
    "gi",
  );
  // 3) esbuild/vite style: "path/to/file.tsx:LINE:COL: ERROR: message"
  const esbuildRx = new RegExp(
    String.raw`(${FILE_CHARS}):(\d+):(\d+):\s*(?:ERROR|error)[:\s-]*(.*)`,
    "g",
  );
  // 4) Generic "at path/to/file.tsx:LINE(:COL)?"
  const atRx = new RegExp(
    String.raw`\b(?:at|File:|Location:)\s+(${FILE_CHARS}):(\d+)(?::(\d+))?`,
    "g",
  );
  // 5) SyntaxError / Transform failed followed later by a file reference.
  const genericErrRx =
    /(?:SyntaxError|Transform failed|Unexpected token|is not exported by)[:\s-]+(.*)/i;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    let m;

    failResolveRx.lastIndex = 0;
    while ((m = failResolveRx.exec(ln)) !== null) {
      push(m[2], 1, 1, `Failed to resolve import "${m[1]}"`);
    }
    rollupResolveRx.lastIndex = 0;
    while ((m = rollupResolveRx.exec(ln)) !== null) {
      push(m[2], 1, 1, `Rollup failed to resolve import "${m[1]}"`);
    }
    esbuildRx.lastIndex = 0;
    while ((m = esbuildRx.exec(ln)) !== null) {
      const [, file, line, col, msg] = m;
      push(file, Number(line), Number(col), (msg || "Build error").trim());
    }
    atRx.lastIndex = 0;
    while ((m = atRx.exec(ln)) !== null) {
      const [, file, line, col] = m;
      // Pair with the nearest preceding error-ish line for context.
      const contextLine =
        [...Array(4).keys()]
          .map((k) => lines[i - 1 - k])
          .find((s) => s && errorPatterns.some((rx) => rx.test(s))) ??
        genericErrRx.exec(ln)?.[1] ??
        ln;
      push(file, Number(line), col ? Number(col) : 1, contextLine.trim().slice(0, 400));
    }
  }

  // Fall back: if we only got unresolved specifiers but no importer path,
  // still annotate at repo root so the PR gets *some* signal.
  if (annotations.size === 0 && importSpecs.size > 0) {
    for (const spec of importSpecs) {
      annotations.set(`::${spec}`, {
        file: "package.json",
        line: 1,
        col: 1,
        message: `Unresolved import "${spec}" (importer path not detected in log)`,
      });
    }
  }

  if (annotations.size > 0) {
    // Print to stdout so GitHub Actions parses them out of the workflow log.
    for (const a of annotations.values()) {
      process.stdout.write(
        `::error file=${a.file},line=${a.line},col=${a.col}::${escape(a.message)}\n`,
      );
    }
  }

  console.error("\n💡 Next steps:");
  console.error("   1. Open the file above and verify the import path exists.");
  console.error("   2. For missing packages, run: bun add <package>");
  console.error("   3. For missing local files, create the file or fix the path.");
  console.error("   4. Re-run: bun run build:dev:diagnose\n");

  process.exit(code ?? 1);
});
