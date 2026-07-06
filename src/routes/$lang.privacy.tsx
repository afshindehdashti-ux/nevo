import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/$lang/privacy")({
  head: ({ params }) =>
    buildSeo({
      title: "Privacy Policy",
      description:
        "How NEVO Industrial collects, uses, stores, and protects personal data across our engineering platform, calculators, and customer portals.",
      path: "/privacy",
      lang: params.lang,
    }),

  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const bullets = t("privacy.s2.items", { returnObjects: true }) as string[];

  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-foreground">
      <h1 className="mb-2 text-4xl font-semibold tracking-tight">{t("privacy.title")}</h1>
      <p className="mb-10 text-sm text-muted-foreground">{t("privacy.lastUpdated", { year })}</p>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s1.h")}</h2>
          <p>{t("privacy.s1.p")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s2.h")}</h2>
          <ul className="list-disc space-y-1 pl-6">
            {Array.isArray(bullets) && bullets.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s3.h")}</h2>
          <p>{t("privacy.s3.p")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s4.h")}</h2>
          <p>{t("privacy.s4.p")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s5.h")}</h2>
          <p>{t("privacy.s5.p")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s6.h")}</h2>
          <p>
            {t("privacy.s6.pBefore")}
            <a href="mailto:privacy@nevoindustrial.com" className="underline">
              privacy@nevoindustrial.com
            </a>
            {t("privacy.s6.pAfter")}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">{t("privacy.s7.h")}</h2>
          <p>
            {t("privacy.s7.pBefore")}
            <a href="/contact" className="underline">
              {t("privacy.s7.link")}
            </a>
            {t("privacy.s7.pAfter")}
          </p>
        </section>
      </div>
    </main>
  );
}
