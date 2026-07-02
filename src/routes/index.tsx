import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

function detectLocale(request?: Request): Locale {
  if (request) {
    const cookie = request.headers.get("cookie") ?? "";
    const m = cookie.match(/NEVO_LANG=([a-zA-Z-]+)/);
    if (m && (SUPPORTED_LOCALES as readonly string[]).includes(m[1])) {
      return m[1] as Locale;
    }
    const accept = request.headers.get("accept-language") ?? "";
    for (const part of accept.split(",")) {
      const code = part.trim().slice(0, 2).toLowerCase();
      if ((SUPPORTED_LOCALES as readonly string[]).includes(code)) {
        return code as Locale;
      }
    }
  }
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/NEVO_LANG=([a-zA-Z-]+)/);
    if (m && (SUPPORTED_LOCALES as readonly string[]).includes(m[1])) {
      return m[1] as Locale;
    }
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (nav && (SUPPORTED_LOCALES as readonly string[]).includes(nav)) {
      return nav as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    // Server-side we don't have request here easily; fall back to default.
    const lang = detectLocale();
    throw redirect({
      to: "/$lang",
      params: { lang },
      replace: true,
      search: location.search,
    });
  },
});
