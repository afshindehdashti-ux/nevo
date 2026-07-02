// Locale-aware phone validation.
// We intentionally stay permissive: users paste in many formats
// (spaces, dashes, parentheses, dots, leading 00, leading +).
// We normalise to digits, honour a leading +/00 as an international
// prefix, and check the digit count against a per-locale range that
// matches the ITU numbering plan for that country plus common variants.

export interface PhoneLocaleRule {
  /** ISO country calling code (no `+`). */
  cc: string;
  /** Example number rendered in the locale's preferred format. */
  example: string;
  /** Accepted total digit count when written in international form (cc + subscriber). */
  minIntlDigits: number;
  maxIntlDigits: number;
  /** Accepted digit count when written in national form (leading 0 trunk allowed). */
  minNationalDigits: number;
  maxNationalDigits: number;
}

// Keep ranges wide enough to cover mobile, landline, and short business numbers,
// but tight enough to still catch obvious junk (< 7 digits, > 15 digits per E.164).
export const PHONE_LOCALES: Record<string, PhoneLocaleRule> = {
  en: { cc: "1",  example: "+1 555 123 4567",     minIntlDigits: 11, maxIntlDigits: 15, minNationalDigits: 10, maxNationalDigits: 11 },
  ar: { cc: "971",example: "+971 4 123 4567",     minIntlDigits: 11, maxIntlDigits: 15, minNationalDigits: 8,  maxNationalDigits: 10 },
  tr: { cc: "90", example: "+90 212 123 45 67",   minIntlDigits: 12, maxIntlDigits: 13, minNationalDigits: 10, maxNationalDigits: 11 },
  ru: { cc: "7",  example: "+7 495 123 45 67",    minIntlDigits: 11, maxIntlDigits: 12, minNationalDigits: 10, maxNationalDigits: 11 },
  pt: { cc: "55", example: "+55 11 91234 5678",   minIntlDigits: 12, maxIntlDigits: 13, minNationalDigits: 9,  maxNationalDigits: 11 },
  de: { cc: "49", example: "+49 30 12345678",     minIntlDigits: 11, maxIntlDigits: 14, minNationalDigits: 9,  maxNationalDigits: 12 },
  es: { cc: "34", example: "+34 612 34 56 78",    minIntlDigits: 11, maxIntlDigits: 12, minNationalDigits: 9,  maxNationalDigits: 9  },
  fr: { cc: "33", example: "+33 6 12 34 56 78",   minIntlDigits: 11, maxIntlDigits: 12, minNationalDigits: 9,  maxNationalDigits: 10 },
  it: { cc: "39", example: "+39 320 123 4567",    minIntlDigits: 11, maxIntlDigits: 13, minNationalDigits: 9,  maxNationalDigits: 11 },
  zh: { cc: "86", example: "+86 138 0000 0000",   minIntlDigits: 12, maxIntlDigits: 13, minNationalDigits: 11, maxNationalDigits: 12 },
};

const ALLOWED = /^[+\d\s().\-\u2013\u2014\u00A0]{7,25}$/;

export function getPhoneRule(locale?: string): PhoneLocaleRule | undefined {
  if (!locale) return undefined;
  const key = locale.toLowerCase().split(/[-_]/)[0];
  return PHONE_LOCALES[key];
}

export function getPhoneExample(locale?: string): string {
  return getPhoneRule(locale)?.example ?? "+1 555 123 4567";
}

/**
 * Loose but locale-aware phone validation. Returns true when the input plausibly
 * matches the locale's numbering plan (or, without a locale, the E.164 length
 * range of 7–15 digits).
 */
export function isValidPhone(raw: string, locale?: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!ALLOWED.test(trimmed)) return false;

  // Normalise leading 00 to + (common in EU, MENA, LATAM).
  const normalised = trimmed.replace(/^00/, "+");
  const isIntl = normalised.startsWith("+");
  const digits = normalised.replace(/\D/g, "");
  const len = digits.length;

  // Global E.164 guardrail.
  if (len < 7 || len > 15) return false;

  const rule = getPhoneRule(locale);
  if (!rule) return true; // no locale hint → E.164 range only

  if (isIntl) {
    // If they typed the country code, it must match this locale's cc when
    // starting with it — otherwise still accept international numbers that
    // are within the general intl range (users travel, expats, etc.).
    if (digits.startsWith(rule.cc)) {
      return len >= rule.minIntlDigits && len <= rule.maxIntlDigits;
    }
    return len >= 8 && len <= 15;
  }
  // National form (may include leading trunk 0).
  return len >= rule.minNationalDigits && len <= rule.maxNationalDigits;
}
