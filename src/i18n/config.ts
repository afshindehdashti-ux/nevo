import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";
import pt from "./locales/pt.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";
import zh from "./locales/zh.json";

export type Locale =
  | "en" | "ar" | "tr" | "ru" | "pt" | "de" | "es" | "fr" | "it" | "zh";

export const LOCALES: {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
  ogLocale: string;
}[] = [
  { code: "en", name: "English",    nativeName: "English",    flag: "🇬🇧", dir: "ltr", ogLocale: "en_US" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",    flag: "🇦🇪", dir: "rtl", ogLocale: "ar_AE" },
  { code: "tr", name: "Turkish",    nativeName: "Türkçe",     flag: "🇹🇷", dir: "ltr", ogLocale: "tr_TR" },
  { code: "ru", name: "Russian",    nativeName: "Русский",    flag: "🇷🇺", dir: "ltr", ogLocale: "ru_RU" },
  { code: "pt", name: "Portuguese", nativeName: "Português",  flag: "🇧🇷", dir: "ltr", ogLocale: "pt_BR" },
  { code: "de", name: "German",     nativeName: "Deutsch",    flag: "🇩🇪", dir: "ltr", ogLocale: "de_DE" },
  { code: "es", name: "Spanish",    nativeName: "Español",    flag: "🇪🇸", dir: "ltr", ogLocale: "es_ES" },
  { code: "fr", name: "French",     nativeName: "Français",   flag: "🇫🇷", dir: "ltr", ogLocale: "fr_FR" },
  { code: "it", name: "Italian",    nativeName: "Italiano",   flag: "🇮🇹", dir: "ltr", ogLocale: "it_IT" },
  { code: "zh", name: "Chinese",    nativeName: "简体中文",     flag: "🇨🇳", dir: "ltr", ogLocale: "zh_CN" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES = LOCALES.map((l) => l.code);

export function localeDir(code: string): "ltr" | "rtl" {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
        tr: { translation: tr },
        ru: { translation: ru },
        pt: { translation: pt },
        de: { translation: de },
        es: { translation: es },
        fr: { translation: fr },
        it: { translation: it },
        zh: { translation: zh },
      },
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      detection: {
        order: ["cookie", "localStorage", "navigator", "htmlTag"],
        caches: ["cookie", "localStorage"],
        lookupCookie: "NEVO_LANG",
        lookupLocalStorage: "NEVO_LANG",
        cookieMinutes: 60 * 24 * 365,
        cookieOptions: { path: "/", sameSite: "lax" },
      },
      react: { useSuspense: false },
    });
}

export default i18n;
