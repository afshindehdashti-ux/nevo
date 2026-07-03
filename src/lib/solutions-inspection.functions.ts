import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LOCALES = ["en", "ar", "tr", "ru", "pt", "de", "es", "fr", "it", "zh"];
const PATHS = [
  "/solutions",
  "/solutions/sandwich-panels",
  "/solutions/production-lines",
  "/solutions/raw-materials",
  "/solutions/factory-development",
  "/solutions/engineering-consultancy",
];
const SITE_URL = "https://nevo-engineering-hub.lovable.app/";
const GATEWAY =
  "https://connector-gateway.lovable.dev/google_search_console/v1/urlInspection/index:inspect";

export type RichTypeSummary = { count: number; errors: number; warnings: number };
export type SolutionsInspectionRow = {
  id: string;
  locale: string;
  path: string;
  url: string;
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  mobile_verdict: string | null;
  rich_verdict: string | null;
  google_canonical: string | null;
  rich_detail: { types: Record<string, RichTypeSummary> };
  last_error: string | null;
  inspected_at: string;
};
export type SolutionsInspectionList = {
  rows: SolutionsInspectionRow[];
  expected: Array<{ locale: string; path: string }>;
};

async function ensureAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listSolutionsInspection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SolutionsInspectionList> => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any)
      .from("solutions_inspection")
      .select(
        "id, locale, path, url, verdict, coverage_state, indexing_state, mobile_verdict, rich_verdict, google_canonical, rich_detail, last_error, inspected_at",
      )
      .order("locale", { ascending: true })
      .order("path", { ascending: true });
    if (error) throw new Error(error.message);
    return {
      rows: (data ?? []) as SolutionsInspectionRow[],
      expected: LOCALES.flatMap((l) => PATHS.map((p) => ({ locale: l, path: p }))),
    };
  });

function summarize(inspection: any) {
  const ir = inspection?.indexStatusResult ?? {};
  const mob = inspection?.mobileUsabilityResult ?? {};
  const rich = inspection?.richResultsResult ?? {};
  const detected = (rich.detectedItems ?? []) as Array<any>;
  const by_type: Record<string, { count: number; errors: number; warnings: number }> = {};
  for (const g of detected) {
    const rtype = g?.richResultType ?? "Unknown";
    const items = g?.items ?? [];
    let errors = 0;
    let warnings = 0;
    for (const it of items) {
      for (const iss of it?.issues ?? []) {
        const sev = String(iss?.severity ?? "").toUpperCase();
        if (sev === "ERROR") errors++;
        else if (sev === "WARNING") warnings++;
      }
    }
    by_type[rtype] = { count: items.length, errors, warnings };
  }
  return {
    verdict: ir.verdict ?? null,
    coverage_state: ir.coverageState ?? null,
    indexing_state: ir.indexingState ?? null,
    mobile_verdict: mob.verdict ?? null,
    rich_verdict: rich.verdict ?? null,
    google_canonical: ir.googleCanonical ?? null,
    rich_detail: { types: by_type },
  };
}

export const runSolutionsInspection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
    if (!gscKey)
      throw new Error(
        "Google Search Console connector not linked (GOOGLE_SEARCH_CONSOLE_API_KEY missing).",
      );

    let ok = 0;
    let failed = 0;
    for (const locale of LOCALES) {
      for (const path of PATHS) {
        const url = `${SITE_URL.replace(/\/$/, "")}/${locale}${path}`;
        const record: Record<string, any> = {
          locale,
          path,
          url,
          inspected_at: new Date().toISOString(),
        };
        try {
          const res = await fetch(GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "X-Connection-Api-Key": gscKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE_URL }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            record.last_error = `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 200)}`;
            failed++;
          } else {
            Object.assign(record, summarize(body?.inspectionResult ?? {}));
            record.last_error = null;
            ok++;
          }
        } catch (e: any) {
          record.last_error = String(e?.message ?? e).slice(0, 200);
          failed++;
        }
        const { error: upErr } = await context.supabase
          .from("solutions_inspection")
          .upsert(record, { onConflict: "locale,path" });
        if (upErr) throw new Error(upErr.message);
        // gentle pacing to stay under GSC quota
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    return { ok, failed, total: LOCALES.length * PATHS.length };
  });
