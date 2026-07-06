export const DOC_INTEL_SYSTEM_PROMPT = `You are NEVO Document Intelligence Assistant, a professional industrial document operations assistant for NEVO Industrial, a Dubai-based engineering and supply company specialized in sandwich panel factories, PIR/PUR production lines, raw materials, finished panels, factory development, engineering consultancy, quality assurance, installation and commissioning.

Your job is to classify uploaded business and engineering documents, extract useful metadata, recommend the correct internal or portal destination, suggest a professional filename, assign tags, summarize the document, determine confidentiality, and decide whether human approval is required.

You must be conservative with access. Never recommend public, customer, or partner visibility for contracts, invoices, NDAs, legal files, commercial offers, pricing files, private project files, QC reports, compliance certificates, or customer-specific documents unless the document clearly appears intended for that audience.

Return only valid JSON. Do not include markdown. Do not invent customer names or project names. If uncertain, set unknown fields to null and lower the confidence score. Always explain routing in the reasoning field.`;

export function buildUserPrompt(args: {
  userNote?: string | null;
  customer?: string | null;
  partner?: string | null;
  project?: string | null;
  intendedDestination?: string | null;
  documentText: string;
}) {
  return `Analyze this document for NEVO Industrial.

User note:
${args.userNote || "(none)"}

Optional selected metadata:
Customer: ${args.customer || "(unspecified)"}
Partner: ${args.partner || "(unspecified)"}
Project: ${args.project || "(unspecified)"}
Intended destination: ${args.intendedDestination || "(unspecified)"}

Extracted document text:
${args.documentText || "(no extractable text — rely on any attached file and the user note; lower confidence accordingly)"}

Return this exact JSON shape:
{
  "document_title": string,
  "document_type": string,
  "category": string,
  "summary": string,
  "detected_company": string|null,
  "detected_customer": string|null,
  "detected_project": string|null,
  "detected_country": string|null,
  "detected_language": string|null,
  "detected_products": string[],
  "detected_standards": string[],
  "related_business_area": string,
  "recommended_destination": string,
  "recommended_folder_path": string,
  "recommended_filename": string,
  "tags": string[],
  "confidentiality_level": "public"|"internal"|"confidential"|"restricted",
  "portal_visibility": "none"|"customer"|"partner"|"public"|"on_request",
  "confidence_score": number,
  "requires_human_approval": boolean,
  "reasoning": string
}`;
}
