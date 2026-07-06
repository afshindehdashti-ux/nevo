// Small helpers for handing calculator/configurator state to the Project Inquiry page.
// The state is base64url-encoded JSON in the `?config=` query param.

export function encodeInquiryConfig(value: unknown): string {
  const json = JSON.stringify(value);
  // btoa handles latin1; unescape/encodeURIComponent trick supports full unicode.
  const b64 =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildInquiryUrl(lang: string, value: unknown): string {
  return `/${lang}/project-inquiry?config=${encodeInquiryConfig(value)}#wizard`;
}
