/**
 * Lightweight accessibility + contrast audit for rendered email HTML.
 * Runs entirely in the browser using DOMParser — no network calls.
 *
 * Severity ranking:
 *   - "critical" — blocks assistive tech / screen readers
 *   - "warning"  — WCAG AA contrast miss, missing metadata
 *   - "info"     — best-practice nits
 */

export type A11ySeverity = "critical" | "warning" | "info";

export interface A11yIssue {
  severity: A11ySeverity;
  rule: string;
  message: string;
  /** Short snippet identifying the offending element. */
  snippet?: string;
  /** Contrast ratio for contrast issues (rounded to 2 decimals). */
  ratio?: number;
}

export interface A11yReport {
  issues: A11yIssue[];
  counts: { critical: number; warning: number; info: number };
  checkedAt: number;
}

/* ---------------- Color helpers ---------------- */

function parseColor(input: string): [number, number, number] | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  if (s === "transparent") return null;

  // #rgb / #rrggbb
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3)
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // rgb() / rgba()
  const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];

  // Common named colors used in emails
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    blue: [0, 0, 255],
    green: [0, 128, 0],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
  };
  return named[s] ?? null;
}

function luminance([r, g, b]: [number, number, number]): number {
  const toLin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

/** Walk up the tree to find an effective background color; fallback to white. */
function resolveBackground(el: Element): [number, number, number] {
  let cur: Element | null = el;
  while (cur) {
    const style = (cur as HTMLElement).getAttribute("style") ?? "";
    const bg =
      /background-color\s*:\s*([^;]+)/i.exec(style)?.[1] ??
      /background\s*:\s*([^;]+)/i.exec(style)?.[1];
    if (bg) {
      const first = bg.trim().split(/\s+/)[0];
      const parsed = parseColor(first);
      if (parsed) return parsed;
    }
    const bgcolor = cur.getAttribute("bgcolor");
    if (bgcolor) {
      const parsed = parseColor(bgcolor);
      if (parsed) return parsed;
    }
    cur = cur.parentElement;
  }
  return [255, 255, 255];
}

function inlineColor(el: Element): [number, number, number] | null {
  const style = (el as HTMLElement).getAttribute("style") ?? "";
  const m = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style);
  if (!m) return null;
  return parseColor(m[1].trim());
}

function isLargeText(el: Element): boolean {
  const style = (el as HTMLElement).getAttribute("style") ?? "";
  const size = /font-size\s*:\s*([\d.]+)\s*px/i.exec(style)?.[1];
  const weight = /font-weight\s*:\s*([\d]+)/i.exec(style)?.[1];
  const px = size ? Number(size) : 16;
  const bold = weight ? Number(weight) >= 700 : /<(h1|h2|h3|strong|b)>/i.test(el.tagName);
  // WCAG large text: >= 24px, or >= 18.66px bold
  return px >= 24 || (bold && px >= 18.66);
}

function snippetOf(el: Element): string {
  const text = (el.textContent ?? "").trim().replace(/\s+/g, " ");
  if (text) return text.length > 60 ? text.slice(0, 57) + "…" : text;
  const html = (el as HTMLElement).outerHTML ?? "";
  return html.length > 80 ? html.slice(0, 77) + "…" : html;
}

/* ---------------- Audit ---------------- */

export function auditEmailHtml(html: string): A11yReport {
  const issues: A11yIssue[] = [];

  if (typeof window === "undefined" || !("DOMParser" in window)) {
    return { issues, counts: { critical: 0, warning: 0, info: 0 }, checkedAt: Date.now() };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");

  // Root <html lang="…">
  const htmlEl = doc.documentElement;
  if (!htmlEl.getAttribute("lang")) {
    issues.push({
      severity: "warning",
      rule: "html-has-lang",
      message:
        "Missing lang attribute on <html>. Screen readers may not pronounce content correctly.",
    });
  }

  // Images
  doc.querySelectorAll("img").forEach((img) => {
    const alt = img.getAttribute("alt");
    const role = img.getAttribute("role");
    if (alt === null) {
      issues.push({
        severity: "critical",
        rule: "img-alt",
        message:
          'Image missing alt attribute. Add alt="" for decorative images or descriptive text otherwise.',
        snippet: img.getAttribute("src") ?? "<img>",
      });
    } else if (alt.trim() === "" && role !== "presentation" && role !== "none") {
      issues.push({
        severity: "info",
        rule: "img-alt-empty",
        message:
          'Empty alt is fine for decorative images. Add role="presentation" to make intent explicit.',
        snippet: img.getAttribute("src") ?? "<img>",
      });
    }
  });

  // Links
  doc.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href");
    const text = (a.textContent ?? "").trim();
    const label = a.getAttribute("aria-label") ?? text;
    if (!href) {
      issues.push({
        severity: "critical",
        rule: "link-href",
        message: "Anchor without href. Email clients often strip these.",
        snippet: snippetOf(a),
      });
    } else if (!label) {
      issues.push({
        severity: "critical",
        rule: "link-name",
        message: "Link has no accessible name. Add visible text or aria-label.",
        snippet: href,
      });
    } else if (/^(click here|here|read more|link)$/i.test(label)) {
      issues.push({
        severity: "info",
        rule: "link-descriptive",
        message: `Link text "${label}" is not descriptive out of context.`,
        snippet: href,
      });
    }
  });

  // Buttons
  doc.querySelectorAll("button").forEach((b) => {
    const label = b.getAttribute("aria-label") ?? (b.textContent ?? "").trim();
    if (!label) {
      issues.push({
        severity: "critical",
        rule: "button-name",
        message: "Button has no accessible name.",
        snippet: snippetOf(b),
      });
    }
  });

  // Heading order
  const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
  let prevLevel = 0;
  for (const h of headings) {
    const level = Number(h.tagName.substring(1));
    if (prevLevel && level > prevLevel + 1) {
      issues.push({
        severity: "warning",
        rule: "heading-order",
        message: `Heading level jumps from h${prevLevel} to h${level}.`,
        snippet: snippetOf(h),
      });
    }
    prevLevel = level;
  }

  // Contrast on text nodes with inline color
  const textCandidates = doc.querySelectorAll(
    "p, span, a, li, td, h1, h2, h3, h4, h5, h6, strong, em, div",
  );
  const seen = new Set<string>();
  textCandidates.forEach((el) => {
    const text = (el.textContent ?? "").trim();
    if (!text || text.length < 2) return;
    // Only check leaves (no element children with text) to avoid double-counting
    const hasChildText = Array.from(el.children).some(
      (c) => (c.textContent ?? "").trim().length > 0,
    );
    if (hasChildText) return;

    const fg = inlineColor(el);
    if (!fg) return;
    const bg = resolveBackground(el);
    const ratio = contrastRatio(fg, bg);
    const min = isLargeText(el) ? 3 : 4.5;
    if (ratio < min) {
      const key = `${fg.join(",")}|${bg.join(",")}|${text.slice(0, 20)}`;
      if (seen.has(key)) return;
      seen.add(key);
      issues.push({
        severity: "warning",
        rule: "color-contrast",
        message: `Contrast ${ratio.toFixed(2)}:1 is below WCAG AA (${min}:1) for this text size.`,
        snippet: text.length > 60 ? text.slice(0, 57) + "…" : text,
        ratio: Math.round(ratio * 100) / 100,
      });
    }
  });

  const counts = { critical: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity]++;
  return { issues, counts, checkedAt: Date.now() };
}
