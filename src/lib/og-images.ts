/**
 * Per-route Open Graph / Twitter Card image mapping.
 *
 * Every leaf route resolves to an absolute image URL so social crawlers never
 * fall back to the hosting-injected screenshot. Images are shared across all
 * 10 locales — surrounding og:title/og:description text is already localized.
 *
 * Vite fingerprints these asset imports, so URLs are cache-busted per build.
 */

import { SITE } from "./seo";

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
export const OG_DEFAULT: string = `${SITE.url}${heroNevoLine}`;

/**
 * Path → absolute OG image URL.
 * Keys are locale-agnostic paths (without the /{lang} prefix).
 */
export const OG_IMAGES: Record<string, string> = {
  "/":                                    `${SITE.url}${heroNevoLine}`,
  "/about":                               `${SITE.url}${engineeringPhilosophy}`,

  // Solutions
  "/solutions":                           `${SITE.url}${heroProductionLine}`,
  "/solutions/factory-development":       `${SITE.url}${ecoFactoryDev}`,
  "/solutions/production-lines":          `${SITE.url}${ecoProductionLines}`,
  "/solutions/raw-materials":             `${SITE.url}${ecoRawMaterials}`,
  "/solutions/engineering-consultancy":   `${SITE.url}${ecoConsultancy}`,
  "/solutions/sandwich-panels":           `${SITE.url}${ecoFinishedPanels}`,

  // Content hubs
  "/industries":                          `${SITE.url}${industriesTile}`,
  "/panels":                              `${SITE.url}${panelsTile}`,
  "/factory-layouts":                     `${SITE.url}${factoryLayoutMaster}`,
  "/factory-layout-generator":            `${SITE.url}${factoryLayoutMaster}`,
  "/pir-vs-rock-wool":                    `${SITE.url}${knowledgePirVsPur}`,
  "/quality":                             `${SITE.url}${knowledgeFireRating}`,

  // Corporate
  "/careers":                             `${SITE.url}${careersHero}`,
  "/contact":                             `${SITE.url}${contactHero}`,
  "/investors":                           `${SITE.url}${investorHero}`,
  "/sustainability":                      `${SITE.url}${sustainabilityHero}`,
  "/privacy":                             `${SITE.url}${engineeringPhilosophy}`,

  // Tools & configurators
  "/product-configurator":                `${SITE.url}${configuratorHero}`,
  "/project-inquiry":                     `${SITE.url}${projectBlueprint}`,
  "/panel-thickness-calculator":          `${SITE.url}${knowledgeCrossSection}`,
  "/investment-calculator":               `${SITE.url}${knowledgeInvestment}`,
  "/ai-project-estimator":                `${SITE.url}${aiTechnicalProposal}`,
  "/engineering-tools":                   `${SITE.url}${engineeringHero}`,
  "/installation-commissioning":          `${SITE.url}${installationHero}`,
  "/download-center":                     `${SITE.url}${knowledgeDatasheet}`,

  // Knowledge / AI
  "/knowledge-hub":                       `${SITE.url}${knowledgeHubHero}`,
  "/ai-assistant":                        `${SITE.url}${aiHeroEngineer}`,
  "/research-innovation":                 `${SITE.url}${aiDigitalTwin}`,

  // Portals
  "/customer-portal":                     `${SITE.url}${factoryHero}`,
  "/partner-portal":                      `${SITE.url}${aiCollab}`,
};

/** Resolve the OG image URL for a locale-agnostic path, falling back to the brand default. */
export function ogImageFor(path: string): string {
  return OG_IMAGES[path] ?? OG_DEFAULT;
}
