const required = [
  "APP_ORIGIN",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
];

const missing = required.filter((name) => !process.env[name]?.trim());
for (const name of required) {
  console.log(`${name}=${missing.includes(name) ? "missing" : "present"}`);
}

function isValidOrigin(value) {
  try {
    const url = new URL(value);
    return url.pathname === "/" && !url.search && !url.hash;
  } catch {
    return false;
  }
}

if (!isValidOrigin(process.env.APP_ORIGIN ?? "")) {
  console.error("APP_ORIGIN must be an absolute origin without a path.");
  missing.push("APP_ORIGIN");
}

if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN?.startsWith("https://")) {
  console.error("Production APP_ORIGIN must use HTTPS.");
  missing.push("APP_ORIGIN");
}

const publicUrl = process.env.VITE_SUPABASE_URL;
const publicKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (publicUrl && publicKey && !missing.length) {
  try {
    const response = await fetch(`${publicUrl.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: publicKey },
    });
    console.log(`supabase_auth_health=${response.status}`);
    if (!response.ok) missing.push("supabase_auth_health");
  } catch {
    console.error("Supabase Auth health check could not connect.");
    missing.push("supabase_auth_health");
  }
}

if (missing.length) {
  console.error(
    "Launch readiness failed. Configure the missing server-only values in the deployment platform.",
  );
  process.exit(1);
}

console.log("Launch readiness checks passed.");
