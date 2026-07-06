import type { AiAnalysis } from "./doc-intel.schema";

export type RoutingRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  match_categories: string[];
  match_doc_type_ilike: string | null;
  match_filename_ilike: string | null;
  match_keywords: string[];
  match_confidentiality: string[];
  match_visibility: string[];
  action_require_approval: boolean;
  action_block_public: boolean;
  action_set_confidentiality: string | null;
  action_set_visibility: string | null;
  action_set_destination: string | null;
  action_set_folder_path: string | null;
  action_add_tags: string[];
  action_min_confidence: number | null;
};

export type RuleInputSnapshot = {
  category: string;
  document_type: string;
  original_filename: string;
  stored_filename: string;
  summary: string;
  confidentiality_level: string;
  portal_visibility: string;
  destination: string;
  folder_path: string;
  ai_confidence: number | null;
};

export type RuleOutcome = {
  confidentiality: string;
  visibility: string;
  destination: string;
  folder_path: string;
  requires_approval: boolean;
  added_tags: string[];
  matched: { id: string; name: string; reasons: string[] }[];
};

function ilikeMatches(pattern: string | null, value: string): boolean {
  if (!pattern) return true;
  const rx = new RegExp(
    "^" +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".") +
      "$",
    "i",
  );
  return rx.test(value);
}

function containsAnyKeyword(keywords: string[], text: string): boolean {
  if (keywords.length === 0) return true;
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

export async function fetchEnabledRules(supabase: {
  from: (t: string) => {
    select: (s: string) => {
      eq: (col: string, val: unknown) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
}): Promise<RoutingRule[]> {
  const { data, error } = await supabase
    .from("doc_intel_routing_rules")
    .select("*")
    .eq("enabled", true)
    .order("priority", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RoutingRule[]).filter((r) => r.enabled);
}

function ruleMatches(rule: RoutingRule, s: RuleInputSnapshot): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (rule.match_categories.length > 0) {
    if (!rule.match_categories.includes(s.category)) return { ok: false, reasons: [] };
    reasons.push(`category=${s.category}`);
  }
  if (rule.match_doc_type_ilike) {
    if (!ilikeMatches(rule.match_doc_type_ilike, s.document_type)) return { ok: false, reasons: [] };
    reasons.push(`doc_type~${rule.match_doc_type_ilike}`);
  }
  if (rule.match_filename_ilike) {
    const name = s.stored_filename || s.original_filename;
    if (!ilikeMatches(rule.match_filename_ilike, name)) return { ok: false, reasons: [] };
    reasons.push(`filename~${rule.match_filename_ilike}`);
  }
  if (rule.match_keywords.length > 0) {
    const hay = `${s.document_type} ${s.summary} ${s.original_filename} ${s.stored_filename}`;
    if (!containsAnyKeyword(rule.match_keywords, hay)) return { ok: false, reasons: [] };
    reasons.push(`keyword hit`);
  }
  if (rule.match_confidentiality.length > 0) {
    if (!rule.match_confidentiality.includes(s.confidentiality_level))
      return { ok: false, reasons: [] };
    reasons.push(`conf=${s.confidentiality_level}`);
  }
  if (rule.match_visibility.length > 0) {
    if (!rule.match_visibility.includes(s.portal_visibility)) return { ok: false, reasons: [] };
    reasons.push(`vis=${s.portal_visibility}`);
  }
  return { ok: true, reasons };
}

export function applyRulesToAnalysis(
  snapshot: RuleInputSnapshot,
  rules: RoutingRule[],
): RuleOutcome {
  const out: RuleOutcome = {
    confidentiality: snapshot.confidentiality_level || "internal",
    visibility: snapshot.portal_visibility || "none",
    destination: snapshot.destination,
    folder_path: snapshot.folder_path,
    requires_approval: false,
    added_tags: [],
    matched: [],
  };
  const tagSet = new Set<string>();
  for (const r of rules) {
    const m = ruleMatches(r, {
      ...snapshot,
      confidentiality_level: out.confidentiality,
      portal_visibility: out.visibility,
      destination: out.destination,
      folder_path: out.folder_path,
    });
    if (!m.ok) continue;
    out.matched.push({ id: r.id, name: r.name, reasons: m.reasons });
    if (r.action_require_approval) out.requires_approval = true;
    if (r.action_min_confidence != null && (snapshot.ai_confidence ?? 0) < r.action_min_confidence) {
      out.requires_approval = true;
    }
    if (r.action_set_confidentiality) out.confidentiality = r.action_set_confidentiality;
    if (r.action_set_visibility) out.visibility = r.action_set_visibility;
    if (r.action_block_public && out.visibility === "public") out.visibility = "none";
    if (r.action_set_destination) out.destination = r.action_set_destination;
    if (r.action_set_folder_path) out.folder_path = r.action_set_folder_path;
    for (const t of r.action_add_tags) tagSet.add(t);
  }
  out.added_tags = [...tagSet];
  return out;
}

/** Convenience wrapper used from analyzeDocument, working directly off AI analysis. */
export function snapshotFromAnalysis(
  a: AiAnalysis,
  originalFilename: string,
): RuleInputSnapshot {
  return {
    category: a.category,
    document_type: a.document_type,
    original_filename: originalFilename,
    stored_filename: a.recommended_filename,
    summary: a.summary,
    confidentiality_level: a.confidentiality_level,
    portal_visibility: a.portal_visibility,
    destination: a.recommended_destination,
    folder_path: a.recommended_folder_path,
    ai_confidence: a.confidence_score ?? null,
  };
}
