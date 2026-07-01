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

const TITLE =
  "NEVO Industrial — Sandwich Panel Engineering, Factory Development & Raw Materials";
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
