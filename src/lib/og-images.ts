/**
 * Per-route Open Graph / Twitter Card image mapping.
 *
 * Every leaf route resolves to an absolute image URL so social crawlers never
 * fall back to the hosting-injected screenshot. Images are shared across all
 * 10 locales — surrounding og:title/og:description text is already localized.
 *
 * Vite fingerprints these asset imports, so URLs are cache-busted per build.
 */

// Home / brand
import heroNevoLine from "@/assets/og/hero-nevo-line.jpg";
import heroProductionLine from "@/assets/og/hero-production-line.jpg";
import engineeringPhilosophy from "@/assets/og/engineering-philosophy.jpg";

// Solutions
import ecoFactoryDev from "@/assets/og/eco-factory-dev.jpg";
import ecoProductionLines from "@/assets/og/eco-production-lines.jpg";
import ecoRawMaterials from "@/assets/og/eco-raw-materials.jpg";
import ecoConsultancy from "@/assets/og/eco-consultancy.jpg";
import ecoFinishedPanels from "@/assets/og/eco-finished-panels.jpg";

// Industries / panels / factory
import industriesTile from "@/assets/og/industries-tile.jpg";
import panelsTile from "@/assets/og/panels-tile.jpg";
import factoryLayoutMaster from "@/assets/og/factory-layout-master.jpg";

// Corporate
import careersHero from "@/assets/og/careers-hero.jpg";
import contactHero from "@/assets/og/contact-hero.jpg";
import investorHero from "@/assets/og/investor-hero.jpg";
import sustainabilityHero from "@/assets/og/sustainability-hero.jpg";

// Tools / configurators
import configuratorHero from "@/assets/og/configurator-hero.jpg";
import projectBlueprint from "@/assets/og/project-blueprint.jpg";
import factoryHero from "@/assets/og/factory-hero.jpg";
import engineeringHero from "@/assets/og/engineering-hero.jpg";
import installationHero from "@/assets/og/installation-hero.jpg";

// Knowledge / reference
import knowledgeHubHero from "@/assets/og/knowledge-hub-hero.jpg";
import knowledgeCrossSection from "@/assets/og/knowledge-cross-section.jpg";
import knowledgePirVsPur from "@/assets/og/knowledge-pir-vs-pur.jpg";
import knowledgeFireRating from "@/assets/og/knowledge-fire-rating.jpg";
import knowledgeInvestment from "@/assets/og/knowledge-investment.jpg";
import knowledgeDatasheet from "@/assets/og/knowledge-datasheet.jpg";

// AI / research
import aiHeroEngineer from "@/assets/og/ai-hero-engineer.jpg";
import aiTechnicalProposal from "@/assets/og/ai-technical-proposal.jpg";
import aiCollab from "@/assets/og/ai-collab.jpg";
import aiDigitalTwin from "@/assets/og/ai-digital-twin.jpg";

/** Site-wide brand fallback (used when a specific route isn't mapped). */
export const OG_DEFAULT: string = heroNevoLine;

/**
 * Path → absolute OG image URL.
 * Keys are locale-agnostic paths (without the /{lang} prefix).
 */
export const OG_IMAGES: Record<string, string> = {
  "/": heroNevoLine,
  "/about": engineeringPhilosophy,

  // Solutions
  "/solutions": heroProductionLine,
  "/solutions/factory-development": ecoFactoryDev,
  "/solutions/production-lines": ecoProductionLines,
  "/solutions/raw-materials": ecoRawMaterials,
  "/solutions/engineering-consultancy": ecoConsultancy,
  "/solutions/sandwich-panels": ecoFinishedPanels,

  // Content hubs
  "/industries": industriesTile,
  "/panels": panelsTile,
  "/factory-layouts": factoryLayoutMaster,
  "/factory-layout-generator": factoryLayoutMaster,
  "/pir-vs-rock-wool": knowledgePirVsPur,
  "/quality": knowledgeFireRating,

  // Corporate
  "/careers": careersHero,
  "/contact": contactHero,
  "/investors": investorHero,
  "/sustainability": sustainabilityHero,
  "/privacy": engineeringPhilosophy,

  // Tools & configurators
  "/product-configurator": configuratorHero,
  "/project-inquiry": projectBlueprint,
  "/panel-thickness-calculator": knowledgeCrossSection,
  "/investment-calculator": knowledgeInvestment,
  "/ai-project-estimator": aiTechnicalProposal,
  "/engineering-tools": engineeringHero,
  "/installation-commissioning": installationHero,
  "/download-center": knowledgeDatasheet,

  // Knowledge / AI
  "/knowledge-hub": knowledgeHubHero,
  "/ai-assistant": aiHeroEngineer,
  "/research-innovation": aiDigitalTwin,

  // Portals
  "/customer-portal": factoryHero,
  "/partner-portal": aiCollab,
};

/** Resolve the OG image URL for a locale-agnostic path, falling back to the brand default. */
export function ogImageFor(path: string): string {
  return OG_IMAGES[path] ?? OG_DEFAULT;
}

/**
 * Build the OG/Twitter image meta entries for a route (spread into a route's meta array).
 * Use in routes that construct their head() config manually rather than via buildSeo().
 */
export function ogImageMeta(path: string, alt?: string): Array<Record<string, string>> {
  const rel = OG_IMAGES[path] ?? OG_DEFAULT;
  const abs = rel.startsWith("http") ? rel : `${SITE_URL}${rel}`;
  return [
    { property: "og:image", content: abs },
    { property: "og:image:secure_url", content: abs },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: alt ?? "NEVO Industrial" },
    { name: "twitter:image", content: abs },
  ];
}
