import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import i18n, { DEFAULT_LOCALE, LOCALES, SUPPORTED_LOCALES, localeDir, type Locale } from "./config";

interface LanguageContextValue {
  lang: Locale;
  dir: "ltr" | "rtl";
  setLang: (lang: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LOCALE,
  dir: "ltr",
  setLang: () => {},
});

/** Locale encoded in the URL (/es/solutions) always wins over stored preferences. */
function readUrlLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const seg = window.location.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return seg && (SUPPORTED_LOCALES as string[]).includes(seg) ? (seg as Locale) : null;
}

function readInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const fromUrl = readUrlLocale();
  if (fromUrl) return fromUrl;
  const stored =
    document.cookie.match(/(?:^|;\s*)NEVO_LANG=([a-zA-Z-]+)/)?.[1] ??
    window.localStorage.getItem("NEVO_LANG");
  if (stored && (SUPPORTED_LOCALES as string[]).includes(stored)) return stored as Locale;
  const nav = window.navigator.language?.slice(0, 2).toLowerCase();
  if (nav && (SUPPORTED_LOCALES as string[]).includes(nav)) return nav as Locale;
  return DEFAULT_LOCALE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Lazy init: on the client the URL locale (or stored preference on
  // non-prefixed paths) is known synchronously, so the very first render is
  // already in the right language and direction.
  const [lang, setLangState] = useState<Locale>(() => readInitialLocale());
  const dir = localeDir(lang);

  useEffect(() => {
    const initial = readInitialLocale();
    setLangState((prev) => (prev === initial ? prev : initial));
    if (i18n.language !== initial) void i18n.changeLanguage(initial);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (next: Locale) => {
    setLangState(next);
    void i18n.changeLanguage(next);
    if (typeof document !== "undefined") {
      document.cookie = `NEVO_LANG=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      try {
        window.localStorage.setItem("NEVO_LANG", next);
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LOCALES, SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { Locale };
