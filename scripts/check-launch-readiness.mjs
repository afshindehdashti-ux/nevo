const required = [
  "APP_ORIGIN",
  "API_ALLOWED_ORIGINS",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "LOVABLE_API_KEY",
];

const missing = required.filter((name) => !process.env[name]?.trim());
for (const name of required) {
  console.log(`${name}=${missing.includes(name) ? "missing" : "present"}`);
}

const placeholders = ["replace-with", "your-project", "your_publishable", "your_server", "_your_"];
for (const name of required) {
  const value = process.env[name]?.trim().toLowerCase() ?? "";
  if (value && placeholders.some((placeholder) => value.includes(placeholder))) {
    console.error(`${name} still contains a placeholder value.`);
    missing.push(name);
  }
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

const allowedOrigins = (process.env.API_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (allowedOrigins.some((origin) => !isValidOrigin(origin))) {
  console.error("API_ALLOWED_ORIGINS must contain comma-separated absolute origins.");
  missing.push("API_ALLOWED_ORIGINS");
}
if (process.env.APP_ORIGIN && !allowedOrigins.includes(process.env.APP_ORIGIN)) {
  console.error("API_ALLOWED_ORIGINS must include APP_ORIGIN.");
  missing.push("API_ALLOWED_ORIGINS");
}

if (
  process.env.EMAIL_FROM &&
  !/^[^\n\r]*<[^<>\s]+@[^<>\s]+>$|^[^\s<>]+@[^\s<>]+$/.test(process.env.EMAIL_FROM)
) {
  console.error("EMAIL_FROM must be an email address or Name <email@domain>.");
  missing.push("EMAIL_FROM");
}

const publicUrl = process.env.VITE_SUPABASE_URL;
const publicKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serverUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (publicUrl && serverUrl && publicUrl.replace(/\/$/, "") !== serverUrl.replace(/\/$/, "")) {
  console.error("SUPABASE_URL and VITE_SUPABASE_URL must reference the same project.");
  missing.push("SUPABASE_URL");
}

if (publicUrl && publicKey) {
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

if (serverUrl && serviceKey) {
  try {
    const response = await fetch(
      `${serverUrl.replace(/\/$/, "")}/auth/v1/admin/users?page=1&per_page=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      },
    );
    if (!response.ok) {
      console.error(`Supabase Admin API check failed (${response.status}).`);
      missing.push("supabase_admin_api");
    } else {
      const payload = await response.json();
      const count = Array.isArray(payload?.users) ? payload.users.length : 0;
      console.log(`supabase_admin_users=${count > 0 ? "present" : "missing"}`);
      if (count === 0) missing.push("supabase_admin_user");
    }
  } catch {
    console.error("Supabase Admin API check could not connect.");
    missing.push("supabase_admin_api");
  }
}

if (missing.length) {
  console.error(
    "Launch readiness failed. Configure the missing server-only values in the deployment platform.",
  );
  process.exit(1);
}

console.log("Launch readiness checks passed.");
