import { z } from "zod";

export const DOC_CATEGORIES = [
  "Company Profile",
  "Factory Development Guide",
  "Factory Layout",
  "Feasibility Study",
  "Investment Report",
  "Production Line Catalogue",
  "Raw Material Specification",
  "PIR/PUR Chemical Datasheet",
  "PPGI/GI/Aluzinc Coil Document",
  "Rock Wool Specification",
  "Finished Panel Datasheet",
  "Panel Technical Drawing",
  "Commercial Proposal",
  "Quotation",
  "Contract",
  "NDA",
  "Invoice",
  "Packing List",
  "Bill of Lading",
  "Quality Control Report",
  "Compliance Certificate",
  "EN / ASTM / GOST / SASO Documentation",
  "Installation Guide",
  "Commissioning Report",
  "Maintenance Manual",
  "Customer Project File",
  "Partner Sales Material",
  "Marketing Brochure",
  "Other",
] as const;

export const DESTINATIONS = [
  "Customer Portal > Project > Documents",
  "Partner Portal > Resources",
  "Download Center > Public",
  "Download Center > On Request",
  "Internal Engineering Library",
  "Internal Sales / Proposal Library",
  "Quality & Compliance Library",
  "Installation & Commissioning Library",
  "Logistics / Shipping Library",
  "Contracts / NDA / Legal Archive",
] as const;

export const CONFIDENTIALITY = ["public", "internal", "confidential", "restricted"] as const;
export const VISIBILITY = ["none", "customer", "partner", "public", "on_request"] as const;
export const STATUS = [
  "uploaded",
  "analyzed",
  "pending_approval",
  "approved",
  "routed",
  "rejected",
] as const;

/** Sensitive categories can never be auto-approved or made public. */
export const SENSITIVE_CATEGORIES = new Set<string>([
  "Contract",
  "NDA",
  "Invoice",
  "Commercial Proposal",
  "Quotation",
  "Quality Control Report",
  "Compliance Certificate",
]);

/** Zod schema mirroring the required AI JSON. Kept flat and constraint-free for structured output. */
export const AiAnalysisSchema = z.object({
  document_title: z.string(),
  document_type: z.string(),
  category: z.string(),
  summary: z.string(),
  detected_company: z.string().nullable(),
  detected_customer: z.string().nullable(),
  detected_project: z.string().nullable(),
  detected_country: z.string().nullable(),
  detected_language: z.string().nullable(),
  detected_products: z.array(z.string()),
  detected_standards: z.array(z.string()),
  related_business_area: z.string(),
  recommended_destination: z.string(),
  recommended_folder_path: z.string(),
  recommended_filename: z.string(),
  tags: z.array(z.string()),
  confidentiality_level: z.string(),
  portal_visibility: z.string(),
  confidence_score: z.number(),
  requires_human_approval: z.boolean(),
  reasoning: z.string(),
});
export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;
