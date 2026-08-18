import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Link } from "@/components/site/LocalizedLink";
import { ArrowRight, Cpu, Layers, Wrench, Factory } from "lucide-react";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { SurfaceCard } from "@/components/site/cards";
import { Button } from "@/components/ui/button";
import { SITE, buildSeo, ldScript, solutionsCatalogJsonLd, ORG_ID, WEBSITE_ID } from "@/lib/seo";
import { ogImageMeta } from "@/lib/og-images";

const TITLE =
  "Solutions — Factory Development, Production Lines, Consultancy & Raw Materials | NEVO Industrial";
const DESCRIPTION =
  "Explore NEVO Industrial's engineering-led solutions: turnkey sandwich panel factories, high-speed production lines, engineering consultancy and premium raw materials for global manufacturers.";
const URL_PATH = "/solutions";

const SOLUTIONS = [
  { to: "/solutions/factory-development", icon: Factory, key: "factory" as const },
  { to: "/solutions/production-lines", icon: Cpu, key: "lines" as const },
  { to: "/solutions/engineering-consultancy", icon: Wrench, key: "consult" as const },
  { to: "/solutions/raw-materials", icon: Layers, key: "materials" as const },
];

function SolutionsIndex() {
  const { t } = useTranslation();
  return (
    <>
      <AnnouncementBar />
      <SiteHeader />
      <main id="main">
        <Section tone="surface">
          <div className="max-w-3xl">
            <Eyebrow>{t("solutionsIndex.eyebrow")}</Eyebrow>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("solutionsIndex.heroTitle")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">{t("solutionsIndex.heroLede")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="primary">
                <Link to="/project-inquiry">
                  {t("solutionsIndex.ctaQuote")} <ArrowRight className="!size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">{t("solutionsIndex.ctaContact")}</Link>
              </Button>
            </div>
          </div>
        </Section>

        <Section>
          <SectionHeader
            eyebrow={t("solutionsIndex.sectionEyebrow")}
            title={t("solutionsIndex.sectionTitle")}
            lede={t("solutionsIndex.sectionLede")}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {SOLUTIONS.map((s) => {
              const title = t(`solutionsIndex.items.${s.key}.title`);
              return (
                <SurfaceCard key={s.to} className="p-8">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md border border-border bg-background">
                      <s.icon className="size-5 text-accent" strokeWidth={1.5} />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {t(`solutionsIndex.items.${s.key}.eyebrow`)}
                    </span>
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t(`solutionsIndex.items.${s.key}.lede`)}
                  </p>
                  <div className="mt-6">
                    <Link
                      to={s.to}
                      className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
                    >
                      {t("solutionsIndex.explore", { name: title })}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/solutions/")({
  head: ({ params }) => {
    const canonical = `${SITE.url}/${params.lang}${URL_PATH}`;
    const crumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.url}/${params.lang}` },
        { "@type": "ListItem", position: 2, name: "Solutions", item: canonical },
      ],
    };
    const seo = buildSeo({
      title: TITLE,
      description: DESCRIPTION,
      path: URL_PATH,
      lang: params.lang,
      keywords: [
        "sandwich panel solutions",
        "sandwich panel factory development",
        "sandwich panel production lines",
        "sandwich panel engineering consultancy",
        "sandwich panel raw materials",
        "PIR PUR rock wool panels",
        "industrial engineering Dubai",
      ],
    });
    const lang = String(params.lang);
    return {
      ...seo,
      scripts: [
        ldScript(crumbsLd),
        ldScript({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: lang,
          isPartOf: { "@id": WEBSITE_ID },
          about: { "@id": ORG_ID },
        }),
        ldScript(
          solutionsCatalogJsonLd({
            lang,
            items: [
              {
                name: "Sandwich Panel Factory Development",
                description:
                  "Turnkey sandwich panel factory development — feasibility, layout, equipment selection, installation and commissioning.",
                path: "/solutions/factory-development",
              },
              {
                name: "Sandwich Panel Production Lines",
                description:
                  "Continuous PIR/PUR laminators, discontinuous presses, rock wool lamella and EPS lines with roll forming and automation.",
                path: "/solutions/production-lines",
              },
              {
                name: "Engineering Consultancy",
                description:
                  "Independent engineering consultancy for panel formulations, process optimisation, certification and factory audits.",
                path: "/solutions/engineering-consultancy",
              },
              {
                name: "Raw Materials Supply",
                description:
                  "PIR/PUR chemical systems, PPGI and galvanized steel coils, facers and adhesives supplied to panel manufacturers worldwide.",
                path: "/solutions/raw-materials",
              },
              {
                name: "Finished Sandwich Panels",
                description:
                  "PIR, PUR, rock wool and EPS sandwich panels for cold storage, clean rooms and industrial building envelopes.",
                path: "/solutions/sandwich-panels",
              },
            ],
          }),
        ),
      ],
    };

  },
  component: SolutionsIndex,
});
