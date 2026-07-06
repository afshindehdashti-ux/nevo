import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

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

type GscInspectionResult = {
  indexStatusResult?: {
    verdict?: string | null;
    coverageState?: string | null;
    indexingState?: string | null;
    googleCanonical?: string | null;
  };
  mobileUsabilityResult?: {
    verdict?: string | null;
  };
  richResultsResult?: {
    verdict?: string | null;
    detectedItems?: Array<{
      richResultType?: string | null;
      items?: Array<{
        issues?: Array<{
          severity?: string | null;
        }>;
      }>;
    }>;
  };
};

async function ensureAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Role check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listSolutionsInspection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SolutionsInspectionList> => {
    const supabase = context.supabase as SupabaseClient<Database>;
    await ensureAdmin(supabase, context.userId as string);
    const { data, error } = await supabase
      .from("solutions_inspection")
      .select(
        "id, locale, path, url, verdict, coverage_state, indexing_state, mobile_verdict, rich_verdict, google_canonical, rich_detail, last_error, inspected_at",
      )
      .order("locale", { ascending: true })
      .order("path", { ascending: true });
    if (error) throw new Error(error.message);
    return {
      rows: (data ?? []) as unknown as SolutionsInspectionRow[],
      expected: LOCALES.flatMap((l) => PATHS.map((p) => ({ locale: l, path: p }))),
    };
  });

function summarize(inspection: GscInspectionResult) {
  const ir = inspection?.indexStatusResult ?? {};
  const mob = inspection?.mobileUsabilityResult ?? {};
  const rich = inspection?.richResultsResult ?? {};
  const detected = rich.detectedItems ?? [];
  const by_type: Record<string, RichTypeSummary> = {};
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
    const supabase = context.supabase as SupabaseClient<Database>;
    await ensureAdmin(supabase, context.userId as string);
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
        const record: Database["public"]["Tables"]["solutions_inspection"]["Insert"] = {
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
          const body = (await res.json().catch(() => ({}))) as {
            inspectionResult?: GscInspectionResult;
          };
          if (!res.ok) {
            record.last_error = `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 200)}`;
            failed++;
          } else {
            Object.assign(record, summarize(body?.inspectionResult ?? {}));
            record.last_error = null;
            ok++;
          }
        } catch (e) {
          record.last_error = String(e instanceof Error ? e.message : e).slice(0, 200);
          failed++;
        }
        const { error: upErr } = await supabase
          .from("solutions_inspection")
          .upsert(record, { onConflict: "locale,path" });
        if (upErr) throw new Error(upErr.message);
        // gentle pacing to stay under GSC quota
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    return { ok, failed, total: LOCALES.length * PATHS.length };
  });
