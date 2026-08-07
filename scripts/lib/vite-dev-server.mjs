import { spawn } from "node:child_process";
import net from "node:net";

const DEFAULT_SUPABASE_URL = "https://ci-placeholder.supabase.co";
const DEFAULT_SUPABASE_KEY = "sb_publishable_ci_placeholder";
const MAX_LOG_LENGTH = 20_000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createServerEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    DEFAULT_SUPABASE_KEY;

  return {
    ...process.env,
    NODE_ENV: "development",
    SUPABASE_URL: supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: supabaseKey,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? supabaseUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? supabaseKey,
  };
}

export function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

export async function startViteDevServer({
  port,
  host = "127.0.0.1",
  probePath = "/en/solutions",
  timeoutMs = 120_000,
}) {
  let output = "";
  let spawnError;
  let lastStatus;
  let lastRequestError;

  const appendOutput = (chunk) => {
    output = `${output}${chunk.toString()}`.slice(-MAX_LOG_LENGTH);
  };

  const proc = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "dev",
      "--port",
      String(port),
      "--host",
      host,
      "--strictPort",
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: createServerEnv(),
    },
  );

  proc.stdout.on("data", appendOutput);
  proc.stderr.on("data", appendOutput);
  proc.once("error", (error) => {
    spawnError = error;
  });

  const baseUrl = `http://${host}:${port}`;
  const probeUrl = new URL(probePath, baseUrl);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (spawnError || proc.exitCode !== null) break;

    try {
      const response = await fetch(probeUrl, { redirect: "follow" });
      lastStatus = response.status;
      if (response.ok) return { baseUrl, proc };
    } catch (error) {
      lastRequestError = error;
    }

    await delay(500);
  }

  proc.kill("SIGTERM");

  const details = [
    spawnError ? `spawn error: ${spawnError.message}` : null,
    proc.exitCode !== null ? `exit code: ${proc.exitCode}` : null,
    lastStatus ? `last probe status: ${lastStatus}` : null,
    lastRequestError ? `last probe error: ${lastRequestError.message}` : null,
    output.trim() ? `server output:\n${output.trim()}` : "server output: (none)",
  ]
    .filter(Boolean)
    .join("\n");

  throw new Error(`Dev server on ${baseUrl} did not become ready.\n${details}`);
}
