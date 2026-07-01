import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Hero } from "@/components/site/Hero";
import { Pathways } from "@/components/site/Pathways";
import { Solutions } from "@/components/site/Solutions";
import { WhyNevo } from "@/components/site/WhyNevo";
import { Industries } from "@/components/site/Industries";
import { Process } from "@/components/site/Process";
import { Markets } from "@/components/site/Markets";
import { KnowledgeHub } from "@/components/site/KnowledgeHub";
import { FAQ } from "@/components/site/FAQ";
import { CTABanner } from "@/components/site/CTABanner";
import { ContactSection } from "@/components/site/ContactSection";
import { SiteFooter } from "@/components/site/SiteFooter";

const TITLE =
  "NEVO Industrial — Sandwich Panel Engineering, Raw Materials & Production Lines";
const DESCRIPTION =
  "Dubai-based industrial engineering & supply company for the sandwich panel industry — factory development, engineering consultancy, PIR/PUR raw materials, production lines and finished panels.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "NEVO Industrial",
          url: "https://nevoindustrial.com",
          description: DESCRIPTION,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Dubai",
            addressCountry: "AE",
          },
          areaServed: [
            "Saudi Arabia",
            "Oman",
            "United Arab Emirates",
            "Turkey",
            "Iraq",
            "Kenya",
            "Cameroon",
            "Russia",
          ],
        }),
      },
    ],
  }),
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
        <Solutions />
        <WhyNevo />
        <Industries />
        <Process />
        <Markets />
        <KnowledgeHub />
        <FAQ />
        <CTABanner />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  );
}
