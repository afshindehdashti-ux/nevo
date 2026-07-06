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
import heroNevoLine from "@/assets/hero-nevo-line.jpg";
import heroProductionLine from "@/assets/hero-production-line.jpg";
import engineeringPhilosophy from "@/assets/engineering-philosophy.jpg";

// Solutions
import ecoFactoryDev from "@/assets/ai/eco-factory-development.jpg";
import ecoProductionLines from "@/assets/ai/eco-production-lines.jpg";
import ecoRawMaterials from "@/assets/ai/eco-raw-materials.jpg";
import ecoConsultancy from "@/assets/ai/eco-engineering-consultancy.jpg";
import ecoFinishedPanels from "@/assets/ai/eco-finished-panels.jpg";

// Industries / panels / factory
import industriesTile from "@/assets/industries/tile-01.jpg";
import panelsTile from "@/assets/panels/tile-01.jpg";
import factoryLayoutMaster from "@/assets/factory-layouts/fl-01-master.jpg";

// Corporate
import careersHero from "@/assets/corporate/careers-hero.jpg";
import contactHero from "@/assets/corporate/contact-hero.jpg";
import investorHero from "@/assets/corporate/investor-hero.jpg";
import sustainabilityHero from "@/assets/corporate/sustainability-hero.jpg";

// Tools / configurators
import configuratorHero from "@/assets/configurator/hero-configurator.jpg";
import projectBlueprint from "@/assets/project/hero-blueprint.jpg";
import factoryHero from "@/assets/project/hero-factory.jpg";
import engineeringHero from "@/assets/engineering/01-hero.jpg";
import installationHero from "@/assets/installation/inst-01-machine-installation.jpg";

// Knowledge / reference
import knowledgeHubHero from "@/assets/knowledge/hub-hero.jpg";
import knowledgeCrossSection from "@/assets/knowledge/27_cross_section.jpg";
import knowledgePirVsPur from "@/assets/knowledge/29_pir_vs_pur.jpg";
import knowledgeFireRating from "@/assets/knowledge/28_fire_rating.jpg";
import knowledgeInvestment from "@/assets/knowledge/36_investment_report.jpg";
import knowledgeDatasheet from "@/assets/knowledge/32_datasheet.jpg";

// AI / research
import aiHeroEngineer from "@/assets/ai/hero-engineer.jpg";
import aiTechnicalProposal from "@/assets/ai/technical-proposal.jpg";
import aiCollab from "@/assets/ai/collab.jpg";
import aiDigitalTwin from "@/assets/ai/digital-twin.jpg";

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
  const abs = rel.startsWith("http") ? rel : `https://nevoindustrial.com${rel}`;
  return [
    { property: "og:image", content: abs },
    { property: "og:image:secure_url", content: abs },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: alt ?? "NEVO Industrial" },
    { name: "twitter:image", content: abs },
  ];
}
