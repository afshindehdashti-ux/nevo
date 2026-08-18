import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { Pathways } from "@/components/site/Pathways";
import { WhyNevo } from "@/components/site/WhyNevo";
import { Solutions } from "@/components/site/Solutions";
import { Industries } from "@/components/site/Industries";
import { FeaturedFactory } from "@/components/site/FeaturedFactory";
import { KnowledgeHub } from "@/components/site/KnowledgeHub";
import { Markets } from "@/components/site/Markets";
import { Stats } from "@/components/site/Stats";
import { Testimonials } from "@/components/site/Testimonials";
import { CTABanner } from "@/components/site/CTABanner";
import { ContactSection } from "@/components/site/ContactSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  SITE,
  buildSeo,
  ldScript,
  orgJsonLd,
  localBusinessJsonLd,
  websiteJsonLd,
  ORG_ID,
  WEBSITE_ID,
  LOGO_URL,
} from "@/lib/seo";

import { } from "@/lib/og-images";

const TITLE = "NEVO Industrial — Sandwich Panel Engineering, Factory Development & Raw Materials";
const DESCRIPTION =
  "Dubai-based industrial engineering & supply company for the sandwich panel industry — factory development, engineering consultancy, PIR/PUR raw materials, production lines and finished panels.";

export const Route = createFileRoute("/$lang/")({
  head: ({ params }) => {
    const seo = buildSeo({ title: TITLE, description: DESCRIPTION, path: "/", lang: params.lang });
    const lang = String(params.lang);
    return {
      ...seo,
      scripts: [
        ldScript(orgJsonLd()),
        ldScript(localBusinessJsonLd(lang)),
        ldScript(websiteJsonLd(lang)),
        ldScript({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${SITE.url}/${lang}#webpage`,
          url: `${SITE.url}/${lang}`,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: lang,
          isPartOf: { "@id": WEBSITE_ID },
          about: { "@id": ORG_ID },
          primaryImageOfPage: LOGO_URL,
        }),
      ],
    };
  },
  component: Index,
});


function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnnouncementBar />
      <SiteHeader />
      <main>
        <Hero />
        <Pathways />
        <WhyNevo />
        <Solutions />
        <Industries />
        <FeaturedFactory />
        <KnowledgeHub />
        <Markets />
        <Stats />
        <Testimonials />
        <CTABanner />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
