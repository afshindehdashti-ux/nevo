/**
 * Maps the English source strings used in the static header/footer navigation
 * tables to their translation keys, so the site chrome localizes without
 * restructuring every menu definition.
 *
 * Keys already exist in all 10 locale files; anything not listed here falls
 * back to the original English text.
 */
export const NAV_LABEL_KEYS: Record<string, string> = {
  // Solutions
  "Factory Development": "solutions.factoryDevelopment",
  "Feasibility, layout, commissioning.": "solutions.factoryDevelopmentDesc",
  "Engineering Consultancy": "solutions.engineeringConsultancy",
  "Process design & optimization.": "solutions.engineeringConsultancyDesc",
  "Production Lines": "solutions.productionLines",
  "Continuous, discontinuous, roll forming.": "solutions.productionLinesDesc",
  "Raw Materials": "solutions.rawMaterials",
  "PIR, PUR, PPGI, GI, rock wool, adhesives.": "solutions.rawMaterialsDesc",
  "Finished Panels": "solutions.finishedPanels",
  "Premium sandwich panels, delivered.": "solutions.finishedPanelsDesc",
  "Panel Configurator": "solutions.panelConfigurator",
  "Configure panels in 3D with live engineering results.": "solutions.panelConfiguratorDesc",
  "Panel Thickness Calculator": "solutions.thicknessCalculator",
  "Recommend the correct panel thickness by application, climate & fire.":
    "solutions.thicknessCalculatorDesc",
  "Factory Layout Generator": "solutions.layoutGenerator",
  "Design your sandwich panel factory — capacity, core, automation, utilities.":
    "solutions.layoutGeneratorDesc",
  "AI Engineering Assistant": "solutions.aiAssistant",
  "Calculators, estimators and guided scoping.": "solutions.aiAssistantDesc",
  "Featured service": "solutions.featuredEyebrow",
  "Turnkey Factory Development": "solutions.featuredTitle",
  "From feasibility study to first production run — engineered end-to-end.":
    "solutions.featuredDesc",

  // Industries
  "Cold Storage": "home.industriesSection.coldStorage.name",
  "Food Processing": "home.industriesSection.food.name",
  "Industrial Buildings": "home.industriesSection.industrial.name",
  "Clean Rooms": "home.industriesSection.cleanRooms.name",
  Warehousing: "home.industriesSection.warehousing.name",
  "Commercial Buildings": "home.industriesSection.commercial.name",
  "Modular Buildings": "home.industriesSection.modular.name",
  Agriculture: "home.industriesSection.agriculture.name",

  // Knowledge
  "Engineering Articles": "knowledge.articles",
  "Deep technical writing from our engineers.": "knowledge.articlesDesc",
  "Technical Library": "knowledge.library",
  "Specs, datasheets, drawings.": "knowledge.libraryDesc",
  "Download Center": "knowledge.downloads",
  "Engineering guides, catalogs, datasheets.": "knowledge.downloadsDesc",
  "Case Studies": "knowledge.caseStudies",
  "Factories built with NEVO.": "knowledge.caseStudiesDesc",
  FAQ: "knowledge.faq",
  "Common industrial questions.": "knowledge.faqDesc",
  "Investment Guides": "knowledge.investmentGuides",
  "Feasibility and CAPEX planning.": "knowledge.investmentGuidesDesc",
  "Investment Calculator": "knowledge.investmentCalculator",
  "Model CAPEX, OPEX, ROI, IRR & payback.": "knowledge.investmentCalculatorDesc",
  "AI Project Estimator": "knowledge.estimator",
  "Instant AI feasibility: investment, utilities, ROI, IRR.": "knowledge.estimatorDesc",
  "PIR vs Rock Wool": "knowledge.pirVsRockwool",
  "Complete side-by-side comparison guide.": "knowledge.pirVsRockwoolDesc",
  "Research & Innovation": "knowledge.research",
  "R&D roadmap, prototypes and applied testing.": "knowledge.researchDesc",
  "Engineering Tools": "knowledge.tools",
  "Calculators, selectors, references.": "knowledge.toolsDesc",
  "Customer Portal": "knowledge.customerPortal",
  "Secure client dashboard: projects, tracking, documents.": "knowledge.customerPortalDesc",
  "Partner Portal": "knowledge.partnerPortal",
  "Global distributor & EPC workspace: leads, marketing, AI sales.":
    "knowledge.partnerPortalDesc",
  "Latest article": "knowledge.featuredEyebrow",
  "PIR vs Rock Wool: choosing the right core in 2026": "knowledge.featuredTitle",
  "A structural, thermal and fire-performance comparison for cold storage.":
    "knowledge.featuredDesc",
  "Knowledge Hub": "industries.faq.links.hub",

  // Markets
  "Saudi Arabia": "markets.saudiArabia",
  UAE: "markets.uae",
  Oman: "markets.oman",
  Turkey: "markets.turkey",
  Iraq: "markets.iraq",
  Russia: "markets.russia",
  Kenya: "markets.kenya",
  Cameroon: "markets.cameroon",
  Africa: "markets.africa",

  // Company
  "About NEVO": "company.about",
  "Why NEVO": "company.why",
  "Quality Assurance": "company.quality",
  "Sustainability & ESG": "company.sustainability",
  Careers: "company.careers",
  "Investor Relations": "company.investors",
  "Global Offices": "company.offices",
  Contact: "company.contact",
  Privacy: "company.privacy",

  // Group headings
  Solutions: "nav.solutions",
  Industries: "nav.industries",
  Knowledge: "nav.knowledge",
  Markets: "nav.markets",
  Company: "nav.company",
  Resources: "footer.resources",
};

/** Translate a static English nav string, falling back to the original text. */
export function localizeNavLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  text: string | undefined,
): string | undefined {
  if (!text) return text;
  const key = NAV_LABEL_KEYS[text];
  if (!key) return text;
  const translated = t(key, { defaultValue: text });
  return typeof translated === "string" && translated ? translated : text;
}
