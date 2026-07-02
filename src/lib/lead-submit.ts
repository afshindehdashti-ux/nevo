import { toast } from "sonner";

const STORAGE_KEY = "nevo:leads";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d\s-]{7,}$/;

export type LeadPayload = Record<string, FormDataEntryValue | string>;

export interface ValidateRule {
  field: string;
  label: string;
  type?: "text" | "email" | "phone";
  min?: number;
}

export interface LeadOptions {
  source: string;
  rules?: ValidateRule[];
  successTitle?: string;
  successDescription?: string;
}

export function collectFormData(form: HTMLFormElement): LeadPayload {
  const data = new FormData(form);
  const out: LeadPayload = {};
  for (const [k, v] of data.entries()) {
    if (typeof v === "string") out[k] = v.trim();
    else out[k] = v.name; // file — store filename only
  }
  return out;
}

export function validateLead(
  payload: LeadPayload,
  rules: ValidateRule[] = [],
): string | null {
  for (const r of rules) {
    const raw = payload[r.field];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) return `${r.label} is required.`;
    if (r.min && v.length < r.min) return `${r.label} must be at least ${r.min} characters.`;
    if (r.type === "email" && !EMAIL_RE.test(v)) return `Please enter a valid email address.`;
    if (r.type === "phone" && !PHONE_RE.test(v)) return `Please enter a valid phone number.`;
  }
  return null;
}

function persist(source: string, payload: LeadPayload) {
  if (typeof window === "undefined") return;
  try {
    const prev = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    prev.push({ source, payload, at: new Date().toISOString() });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(-50)));
  } catch {
    /* ignore quota / parse errors */
  }
}

/**
 * Handle a lead submission end-to-end:
 * validates required fields, persists locally as fallback, shows toast.
 * Returns true on success so the caller can reset the form.
 */
export async function submitLeadForm(
  form: HTMLFormElement,
  opts: LeadOptions,
): Promise<boolean> {
  const payload = collectFormData(form);
  const error = validateLead(payload, opts.rules);
  if (error) {
    toast.error("Please review the form", { description: error });
    return false;
  }

  persist(opts.source, payload);
  // Simulate async delivery so the UX matches a real backend call.
  await new Promise((r) => setTimeout(r, 350));

  toast.success(opts.successTitle ?? "Request received", {
    description:
      opts.successDescription ??
      "A senior NEVO engineer will reach out within one business day.",
  });
  return true;
}
