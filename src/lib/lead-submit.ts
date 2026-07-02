import { toast } from "sonner";
import { isValidPhone, getPhoneExample } from "./phone-validation";

const STORAGE_KEY = "nevo:leads";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


export type LeadPayload = Record<string, FormDataEntryValue | string>;

export interface ValidateRule {
  field: string;
  label: string;
  type?: "text" | "email" | "phone";
  min?: number;
}

export interface LeadMessages {
  reviewTitle?: string;
  /** Template with `{field}` placeholder. */
  required?: string;
  /** Template with `{field}` and `{min}` placeholders. */
  minLength?: string;
  invalidEmail?: string;
  invalidPhone?: string;
  // Server / delivery failures
  serverErrorTitle?: string;
  serverErrorDesc?: string;
  rateLimitTitle?: string;
  rateLimitDesc?: string;
  networkErrorTitle?: string;
  networkErrorDesc?: string;
  retry?: string;
}

export interface LeadOptions {
  source: string;
  rules?: ValidateRule[];
  successTitle?: string;
  successDescription?: string;
  messages?: LeadMessages;
  /**
   * Optional delivery hook. When provided, its result decides the toast:
   * - resolves with `{ ok: true }` or a `Response` with status < 400 → success
   * - resolves with status 429 → rate-limited toast
   * - resolves with status >= 500 or throws → server / network error toast
   */
  deliver?: (payload: LeadPayload) => Promise<Response | { ok: boolean; status?: number } | void>;
}

const DEFAULT_MESSAGES: Required<LeadMessages> = {
  reviewTitle: "Please review the form",
  required: "{field} is required.",
  minLength: "{field} must be at least {min} characters.",
  invalidEmail: "Please enter a valid email address.",
  invalidPhone: "Please enter a valid phone number.",
  serverErrorTitle: "Submission failed",
  serverErrorDesc: "We couldn't deliver your request. Please try again in a moment.",
  rateLimitTitle: "Too many requests",
  rateLimitDesc: "You've sent several requests in a short time. Please wait a moment and retry.",
  networkErrorTitle: "Network error",
  networkErrorDesc: "Check your connection and try again. Your details were not sent.",
  retry: "Retry",
};


function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
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
  messages: LeadMessages = {},
  phoneLocale?: string,
): string | null {
  const m = { ...DEFAULT_MESSAGES, ...messages };
  for (const r of rules) {
    const raw = payload[r.field];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (!v) return fmt(m.required, { field: r.label });
    if (r.min && v.length < r.min) return fmt(m.minLength, { field: r.label, min: r.min });
    if (r.type === "email" && !EMAIL_RE.test(v)) return m.invalidEmail;
    if (r.type === "phone" && !isValidPhone(v, phoneLocale)) {
      return fmt(m.invalidPhone, { example: getPhoneExample(phoneLocale) });
    }
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
  const m = { ...DEFAULT_MESSAGES, ...(opts.messages ?? {}) };
  const payload = collectFormData(form);
  const error = validateLead(payload, opts.rules, m);
  if (error) {
    toast.error(m.reviewTitle, { description: error });
    return false;
  }

  persist(opts.source, payload);

  // Delivery step — localized failure toasts with retry action.
  const showRetry = (title: string, description: string) => {
    toast.error(title, {
      description,
      action: {
        label: m.retry,
        onClick: () => {
          void submitLeadForm(form, opts);
        },
      },
    });
  };

  try {
    let status = 200;
    if (opts.deliver) {
      const res = await opts.deliver(payload);
      if (res && typeof (res as Response).status === "number") {
        status = (res as Response).status;
      } else if (res && typeof (res as { ok: boolean }).ok === "boolean") {
        status = (res as { ok: boolean; status?: number }).status ?? ((res as { ok: boolean }).ok ? 200 : 500);
      }
    } else {
      // Simulate async delivery so the UX matches a real backend call.
      await new Promise((r) => setTimeout(r, 350));
    }

    if (status === 429) {
      showRetry(m.rateLimitTitle, m.rateLimitDesc);
      return false;
    }
    if (status >= 500 || status >= 400) {
      showRetry(m.serverErrorTitle, m.serverErrorDesc);
      return false;
    }
  } catch (err) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (offline || (err instanceof TypeError && /fetch|network/i.test(err.message))) {
      showRetry(m.networkErrorTitle, m.networkErrorDesc);
    } else {
      showRetry(m.serverErrorTitle, m.serverErrorDesc);
    }
    return false;
  }

  toast.success(opts.successTitle ?? "Request received", {
    description:
      opts.successDescription ??
      "A senior NEVO engineer will reach out within one business day.",
  });
  return true;
}

