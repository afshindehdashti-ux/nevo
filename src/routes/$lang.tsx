import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
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
  },
  component: LangLayout,
});

function LangLayout() {
  const { lang } = Route.useParams();
  const { lang: current, setLang } = useLanguage();
  useEffect(() => {
    if (current !== lang) setLang(lang as Locale);
  }, [lang, current, setLang]);
  return <Outlet />;
}
