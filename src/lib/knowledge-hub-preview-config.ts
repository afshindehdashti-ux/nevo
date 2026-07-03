/**
 * Config-driven mapping between a Solutions route key and the Knowledge Hub
 * article slugs (and optional copy overrides) shown in the route-scoped
 * KnowledgeHubPreview. Edit this file to change which articles appear per
 * Solutions page — no component changes required.
 *
 * To add a new mapping:
 *   1. Add a new entry keyed by the route slug (e.g. "raw-materials").
 *   2. List article slugs from src/lib/knowledge-articles.ts in display order.
 *   3. Optionally override eyebrow / title / lede copy for that route.
 */

export type KnowledgeHubPreviewConfig = {
  slugs: string[];
  eyebrow?: string;
  title?: string;
  lede?: string;
};

export type SolutionsRouteKey =
  | "raw-materials"
  | "sandwich-panels"
  | "production-lines"
  | "engineering-consultancy"
  | "factory-development";

export const KNOWLEDGE_HUB_PREVIEW: Record<SolutionsRouteKey, KnowledgeHubPreviewConfig> = {
  "raw-materials": {
    slugs: ["polyol-mdi", "rockwool-lamella", "pir-vs-rockwool"],
  },
  "sandwich-panels": {
    slugs: ["pir-vs-rockwool", "fire-en13501", "cold-room-design"],
  },
  "production-lines": {
    slugs: ["continuous-line-101", "qc-en14509", "polyol-mdi"],
  },
  "engineering-consultancy": {
    slugs: ["factory-layout", "u-value-thickness", "qc-en14509"],
  },
  "factory-development": {
    slugs: ["factory-layout", "investment-model", "continuous-line-101"],
  },
};

export function getKnowledgeHubPreview(
  route: SolutionsRouteKey,
): KnowledgeHubPreviewConfig {
  return KNOWLEDGE_HUB_PREVIEW[route];
}
