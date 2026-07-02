import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import i18n, { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { useLanguage } from "@/i18n/LanguageProvider";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(params.lang)) {
      throw redirect({
        to: "/$lang",
        params: { lang: DEFAULT_LOCALE },
        replace: true,
      });
    }
    // Sync i18next synchronously so SSR + first client render use the URL locale.
    if (i18n.language !== params.lang) {
      void i18n.changeLanguage(params.lang);
    }
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();
  const { lang: current, setLang } = useLanguage();
  // Ensure the i18n instance is on the right language for this render.
  if (i18n.language !== lang) {
    void i18n.changeLanguage(lang);
  }
  useEffect(() => {
    if (current !== lang) setLang(lang as Locale);
  }, [lang, current, setLang]);
  return <Outlet />;
}
