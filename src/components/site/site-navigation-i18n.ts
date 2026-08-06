import type { TFunction } from "i18next";

const LABEL_KEYS: Record<string, string> = {
  "Factory Development": "solutions.factoryDevelopment",
  "Engineering Consultancy": "solutions.engineeringConsultancy",
  "Production Lines": "solutions.productionLines",
  "Raw Materials": "solutions.rawMaterials",
  "Finished Panels": "solutions.finishedPanels",
  "Sandwich Panels": "solutions.finishedPanels",
  "Panel Configurator": "solutions.panelConfigurator",
  "Panel Thickness Calculator": "solutions.thicknessCalculator",
  "Factory Layout Generator": "solutions.layoutGenerator",
  "AI Engineering Assistant": "solutions.aiAssistant",
  "Featured service": "solutions.featuredEyebrow",
  "Turnkey Factory Development": "solutions.featuredTitle",
  "Cold Storage": "industries.grid.items.0.t",
  "Clean Rooms": "industries.grid.items.1.t",
  "Food Processing": "industries.grid.items.2.t",
  "Industrial Buildings": "industries.grid.items.3.t",
  Warehousing: "industries.grid.items.4.t",
  "Commercial Buildings": "industries.grid.items.5.t",
  Agriculture: "industries.grid.items.6.t",
  "Modular Buildings": "industries.grid.items.7.t",
  "Engineering Articles": "knowledge.articles",
  "Technical Library": "knowledge.library",
  "Download Center": "knowledge.downloads",
  "Case Studies": "knowledge.caseStudies",
  FAQ: "knowledge.faq",
  "Investment Guides": "knowledge.investmentGuides",
  "Investment Calculator": "knowledge.investmentCalculator",
  "AI Project Estimator": "knowledge.estimator",
  "PIR vs Rock Wool": "knowledge.pirVsRockwool",
  "Research & Innovation": "knowledge.research",
  "Engineering Tools": "knowledge.tools",
  "Knowledge Hub": "industries.faq.links.hub",
  "Customer Portal": "knowledge.customerPortal",
  "Partner Portal": "knowledge.partnerPortal",
  "Latest article": "knowledge.featuredEyebrow",
  "PIR vs Rock Wool: choosing the right core in 2026": "knowledge.featuredTitle",
  "Saudi Arabia": "markets.saudiArabia",
  UAE: "markets.uae",
  Oman: "markets.oman",
  Turkey: "markets.turkey",
  Iraq: "markets.iraq",
  Russia: "markets.russia",
  Kenya: "markets.kenya",
  Cameroon: "markets.cameroon",
  Africa: "markets.africa",
  "About NEVO": "company.about",
  "Why NEVO": "company.why",
  "Quality Assurance": "company.quality",
  "Sustainability & ESG": "company.sustainability",
  Careers: "company.careers",
  "Investor Relations": "company.investors",
  "Global Offices": "company.offices",
  "Project Inquiry": "cta.projectInquiry",
  Contact: "company.contact",
  Privacy: "company.privacy",
};

const DESCRIPTION_KEYS: Record<string, string> = {
  "Feasibility, layout, commissioning.": "solutions.factoryDevelopmentDesc",
  "Process design & optimization.": "solutions.engineeringConsultancyDesc",
  "Continuous, discontinuous, roll forming.": "solutions.productionLinesDesc",
  "PIR, PUR, PPGI, GI, rock wool, adhesives.": "solutions.rawMaterialsDesc",
  "Premium sandwich panels, delivered.": "solutions.finishedPanelsDesc",
  "Configure panels in 3D with live engineering results.": "solutions.panelConfiguratorDesc",
  "Recommend the correct panel thickness by application, climate & fire.":
    "solutions.thicknessCalculatorDesc",
  "Design your sandwich panel factory — capacity, core, automation, utilities.":
    "solutions.layoutGeneratorDesc",
  "Calculators, estimators and guided scoping.": "solutions.aiAssistantDesc",
  "From feasibility study to first production run — engineered end-to-end.":
    "solutions.featuredDesc",
  "Deep technical writing from our engineers.": "knowledge.articlesDesc",
  "Specs, datasheets, drawings.": "knowledge.libraryDesc",
  "Engineering guides, catalogs, datasheets.": "knowledge.downloadsDesc",
  "Factories built with NEVO.": "knowledge.caseStudiesDesc",
  "Common industrial questions.": "knowledge.faqDesc",
  "Feasibility and CAPEX planning.": "knowledge.investmentGuidesDesc",
  "Model CAPEX, OPEX, ROI, IRR & payback.": "knowledge.investmentCalculatorDesc",
  "Instant AI feasibility: investment, utilities, ROI, IRR.": "knowledge.estimatorDesc",
  "Complete side-by-side comparison guide.": "knowledge.pirVsRockwoolDesc",
  "R&D roadmap, prototypes and applied testing.": "knowledge.researchDesc",
  "Calculators, selectors, references.": "knowledge.toolsDesc",
  "Secure client dashboard: projects, tracking, documents.": "knowledge.customerPortalDesc",
  "Global distributor & EPC workspace: leads, marketing, AI sales.": "knowledge.partnerPortalDesc",
  "A structural, thermal and fire-performance comparison for cold storage.":
    "knowledge.featuredDesc",
};

function translate(t: TFunction, dictionary: Record<string, string>, fallback: string) {
  const key = dictionary[fallback];
  return key ? t(key, { defaultValue: fallback }) : fallback;
}

export function navigationLabel(t: TFunction, fallback: string) {
  return translate(t, LABEL_KEYS, fallback);
}

export function navigationDescription(t: TFunction, fallback: string) {
  return translate(t, DESCRIPTION_KEYS, fallback);
}
