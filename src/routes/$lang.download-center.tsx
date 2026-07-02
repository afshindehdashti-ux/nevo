import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Download, FileText, X, ChevronRight, Filter, ArrowRight,
  Layers, Factory, Cog, PackageSearch, Snowflake, ShieldCheck,
  Flame, Zap, Building2, Wrench, Sparkles, BookOpen, ClipboardCheck,
  Ruler, MessageSquare, PhoneCall, Boxes, LineChart, ScrollText,
  CheckCircle2, Star, TrendingUp, Clock, Globe2, Box, Award, HardHat,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { buildSeo, orgJsonLd, breadcrumbJsonLd } from "@/lib/seo";

import heroImg from "@/assets/downloads/hero-engineering-portrait.png.asset.json";
import futureHero from "@/assets/downloads/engineering-future-hero.png.asset.json";
import knowledgeHub from "@/assets/downloads/knowledge-hub-library.png.asset.json";
import rawMaterials from "@/assets/downloads/raw-materials-catalog.png.asset.json";
import steelCoils from "@/assets/downloads/steel-coils-inventory.png.asset.json";
import productionLines from "@/assets/downloads/production-lines-catalog.png.asset.json";
import productionOverview from "@/assets/downloads/production-line-overview.png.asset.json";
import continuousPir from "@/assets/downloads/continuous-pir-line.png.asset.json";
import factoryInvestment from "@/assets/downloads/factory-investment-guide.png.asset.json";
import factoryLayout from "@/assets/downloads/factory-layout-generator.png.asset.json";
import engineeringSolutions from "@/assets/downloads/engineering-solutions-brochure.png.asset.json";
import engineeringConsultancy from "@/assets/downloads/engineering-consultancy.png.asset.json";
import panelThickness from "@/assets/downloads/panel-thickness-calculator.png.asset.json";
import productConfigurator from "@/assets/downloads/product-configurator.png.asset.json";
import pirVsRockwool from "@/assets/downloads/pir-vs-rockwool.png.asset.json";
import aiAssistant from "@/assets/downloads/ai-engineering-assistant.png.asset.json";
import projectInquiry from "@/assets/downloads/project-inquiry-playbook.png.asset.json";
import industriesCatalog from "@/assets/downloads/industries-catalog.png.asset.json";
import brandGuidelines from "@/assets/downloads/brand-guidelines.png.asset.json";
import performanceAnalytics from "@/assets/downloads/performance-analytics.png.asset.json";

/* ─────────────────────────────────────────────────────────────── */
/* Types                                                            */
/* ─────────────────────────────────────────────────────────────── */

type Category =
  | "Factory Development" | "Production Lines" | "Engineering Consultancy"
  | "Factory Investment" | "Raw Materials" | "Finished Sandwich Panels"
  | "PIR Technology" | "Rock Wool Technology" | "Automation"
  | "Installation" | "Maintenance" | "Quality Control"
  | "Energy Efficiency" | "Fire Performance" | "Cold Storage"
  | "Clean Rooms" | "Industrial Buildings"
  | "CAD & BIM" | "Certifications";

type DocType =
  | "Engineering Guide" | "Technical Catalog" | "Product Brochure"
  | "Factory Planning Book" | "Technical Datasheet" | "Calculation Sheet"
  | "Engineering Checklist" | "Maintenance Manual" | "Installation Guide"
  | "Case Study" | "White Paper" | "Project Template"
  | "CAD File" | "BIM File" | "Certificate" | "Test Report"
  | "Operation Manual" | "Commissioning Guide" | "Safety Manual"
  | "Troubleshooting Guide";

interface Doc {
  id: string;
  title: string;
  desc: string;
  cover: { url: string };
  category: Category;
  type: DocType;
  industry?: string;
  pages: number;
  size: string;
  lang: string;
  downloads: number;
  updated: string;
  featured?: boolean;
  toc: string[];
  keywords: string[];
}

const DOCS: Doc[] = [
  { id: "factory-master-plan", title: "Sandwich Panel Factory Master Plan", desc: "The complete engineering blueprint to plan, size and build a modern sandwich panel factory — from land to first panel.", cover: factoryInvestment, category: "Factory Development", type: "Factory Planning Book", pages: 128, size: "18.4 MB", lang: "EN · AR", downloads: 4820, updated: "2026-06", featured: true, toc: ["Feasibility & Market Sizing", "Land, Building & Utilities", "Line Selection & Capacity", "CAPEX / OPEX Model", "Automation Roadmap", "Project Timeline"], keywords: ["factory","capex","layout","planning"] },
  { id: "continuous-pir-line", title: "Continuous PIR Sandwich Panel Line — Engineering Guide", desc: "Full technical specification of a modern continuous PIR line: laminator, mixing head, cutting, stacking and packing.", cover: continuousPir, category: "Production Lines", type: "Engineering Guide", pages: 96, size: "14.1 MB", lang: "EN", downloads: 3915, updated: "2026-05", featured: true, toc: ["Line Configuration", "Laminator Design", "Chemical Mixing", "Cutting & Stacking", "Utilities Requirements", "Commissioning"], keywords: ["pir","continuous","line","laminator"] },
  { id: "investment-calculator-guide", title: "Factory Investment Calculator — Methodology", desc: "The engineering methodology behind CAPEX, OPEX, ROI, IRR, NPV and payback modeling for sandwich panel factories.", cover: factoryInvestment, category: "Factory Investment", type: "White Paper", pages: 64, size: "9.6 MB", lang: "EN", downloads: 3120, updated: "2026-05", featured: true, toc: ["CAPEX Components", "OPEX Modeling", "Revenue Assumptions", "Sensitivity Analysis", "Case Studies"], keywords: ["investment","roi","irr","capex"] },
  { id: "pir-vs-rockwool", title: "PIR vs Rock Wool — The Complete Comparison", desc: "Side-by-side thermal, fire, mechanical, acoustic and economic comparison for engineers, consultants and investors.", cover: pirVsRockwool, category: "PIR Technology", type: "White Paper", pages: 88, size: "16.2 MB", lang: "EN", downloads: 5240, updated: "2026-06", featured: true, toc: ["Thermal Performance", "Fire Rating", "Mechanical Strength", "Sound Insulation", "Lifecycle Cost"], keywords: ["pir","rockwool","fire","u-value"] },
  { id: "raw-materials-catalog", title: "Raw Materials Master Catalog", desc: "Steel coils, PIR chemicals, rock wool, adhesives and packaging — specs, grades, tolerances and consumption tables.", cover: rawMaterials, category: "Raw Materials", type: "Technical Catalog", pages: 112, size: "17.8 MB", lang: "EN · AR", downloads: 2980, updated: "2026-05", toc: ["Steel Coils & Coatings", "PIR / PUR Chemicals", "Rock Wool", "Adhesives & Sealants", "Packaging"], keywords: ["steel","chemicals","rockwool"] },
  { id: "steel-coil-datasheet", title: "Pre-Painted Steel Coils — Technical Datasheet", desc: "Complete PPGI/PPGL datasheet: substrates, coatings, RAL colors, tolerances, storage and handling.", cover: steelCoils, category: "Raw Materials", type: "Technical Datasheet", pages: 32, size: "5.4 MB", lang: "EN", downloads: 4120, updated: "2026-04", toc: ["Substrates", "Coatings & Paint Systems", "Color Range (RAL)", "Tolerances", "Handling & Storage"], keywords: ["ppgi","ppgl","steel"] },
  { id: "production-lines-catalog", title: "Production Lines — Full Catalog", desc: "Semi-automatic to fully-automated continuous lines from 3,000 to 20,000 m²/day. Configurations, footprint and utilities.", cover: productionLines, category: "Production Lines", type: "Technical Catalog", pages: 76, size: "13.5 MB", lang: "EN · AR", downloads: 2610, updated: "2026-05", toc: ["Semi-Automatic", "Automatic", "Fully Automated", "Utilities & Footprint", "Options & Accessories"], keywords: ["line","catalog","automatic"] },
  { id: "factory-layout-book", title: "Factory Layout & Master Planning Book", desc: "Zoning, material flow, truck movement, warehouse, laboratory and expansion strategy for panel factories.", cover: factoryLayout, category: "Factory Development", type: "Factory Planning Book", pages: 84, size: "15.2 MB", lang: "EN", downloads: 2440, updated: "2026-06", toc: ["Zones & Circulation", "Material Flow", "Warehouse Logistics", "Utility Corridors", "Expansion Planning"], keywords: ["layout","factory","planning"] },
  { id: "consultancy-services", title: "Engineering Consultancy — Service Portfolio", desc: "How our engineers help you specify, procure, install and commission a sandwich panel factory end-to-end.", cover: engineeringConsultancy, category: "Engineering Consultancy", type: "Product Brochure", pages: 48, size: "8.1 MB", lang: "EN · AR", downloads: 1980, updated: "2026-04", toc: ["Feasibility Studies", "Line Specification", "Procurement", "Commissioning", "Operator Training"], keywords: ["consultancy","engineering"] },
  { id: "panel-thickness-guide", title: "Panel Thickness Selection Guide", desc: "Choose the right sandwich panel thickness based on U-value, fire, weight, sound and application.", cover: panelThickness, category: "Finished Sandwich Panels", type: "Engineering Guide", pages: 42, size: "6.9 MB", lang: "EN", downloads: 3320, updated: "2026-05", toc: ["Thermal Requirements", "Fire Ratings", "Structural Load", "Sound Insulation", "Selection Matrix"], keywords: ["thickness","u-value","selection"] },
  { id: "product-configurator-manual", title: "Product Configurator — Engineering Manual", desc: "How the NEVO Product Configurator computes U-value, weight, fire class and pricing in real time.", cover: productConfigurator, category: "Finished Sandwich Panels", type: "Engineering Guide", pages: 36, size: "5.8 MB", lang: "EN", downloads: 1720, updated: "2026-05", toc: ["Panel Types", "Core Options", "Steel & Coatings", "Accessories", "Calculation Logic"], keywords: ["configurator","panel","spec"] },
  { id: "installation-guide", title: "Panel Installation Guide — Roof & Wall", desc: "Field installation of PIR and rock wool panels — fastening, sealing, tolerances and quality control on site.", cover: productionOverview, category: "Installation", type: "Installation Guide", pages: 58, size: "9.2 MB", lang: "EN · AR", downloads: 3860, updated: "2026-03", toc: ["Site Preparation", "Roof Panels", "Wall Panels", "Sealing & Flashings", "QA Checklist"], keywords: ["install","site","fastening"] },
  { id: "maintenance-manual", title: "Sandwich Panel Line — Maintenance Manual", desc: "Preventive and corrective maintenance procedures for continuous lines. Schedules, parts, lubricants, checklists.", cover: engineeringSolutions, category: "Maintenance", type: "Maintenance Manual", pages: 92, size: "13.7 MB", lang: "EN", downloads: 1450, updated: "2026-02", toc: ["Daily Checks", "Weekly PM", "Monthly PM", "Spare Parts", "Troubleshooting"], keywords: ["maintenance","pm","spares"] },
  { id: "quality-checklist", title: "Quality Control Checklist — Panel Production", desc: "500-point QC checklist covering raw materials, in-process, finished panels and packaging.", cover: performanceAnalytics, category: "Quality Control", type: "Engineering Checklist", pages: 24, size: "3.1 MB", lang: "EN", downloads: 2180, updated: "2026-04", toc: ["Incoming Materials", "In-Process", "Finished Panels", "Packaging", "Documentation"], keywords: ["qa","qc","checklist"] },
  { id: "cold-storage-application", title: "Cold Storage Panel Application Guide", desc: "Panel selection, thickness, joints and vapor barriers for cold rooms, freezers and blast chillers.", cover: industriesCatalog, category: "Cold Storage", type: "Engineering Guide", pages: 54, size: "8.6 MB", lang: "EN", downloads: 2950, updated: "2026-05", toc: ["Temperature Zones", "Vapor Barriers", "Panel Joints", "Doors & Corners", "Case Studies"], keywords: ["cold","freezer","storage"] },
  { id: "clean-rooms-guide", title: "Clean Room Sandwich Panels — Engineering Guide", desc: "GMP, ISO 14644 and pharmaceutical clean room panel systems, joints, coatings and hygiene.", cover: aiAssistant, category: "Clean Rooms", type: "Engineering Guide", pages: 46, size: "7.2 MB", lang: "EN", downloads: 1680, updated: "2026-04", toc: ["ISO 14644 Classes", "GMP Panels", "Flush Joints", "Coving & Corners", "Air Handling"], keywords: ["cleanroom","gmp","pharma"] },
  { id: "industrial-buildings", title: "Industrial Buildings — Panel Case Studies", desc: "Warehouses, logistics hubs, factories and workshops built with NEVO panels across 40+ markets.", cover: industriesCatalog, category: "Industrial Buildings", type: "Case Study", pages: 72, size: "12.4 MB", lang: "EN", downloads: 2120, updated: "2026-05", toc: ["Warehouses", "Logistics Hubs", "Factories", "Workshops", "Retail"], keywords: ["industrial","case"] },
  { id: "fire-performance", title: "Fire Performance of Sandwich Panels", desc: "EN 13501, ASTM E84, reaction-to-fire testing and code compliance for PIR and rock wool systems.", cover: pirVsRockwool, category: "Fire Performance", type: "White Paper", pages: 40, size: "6.4 MB", lang: "EN", downloads: 2470, updated: "2026-03", toc: ["EN 13501", "ASTM E84", "Reaction to Fire", "System Testing", "Code Compliance"], keywords: ["fire","en13501","astm"] },
  { id: "energy-efficiency", title: "Energy Efficiency & U-Value Handbook", desc: "Thermal design, U-value calculation, condensation risk and energy savings for insulated envelopes.", cover: performanceAnalytics, category: "Energy Efficiency", type: "Engineering Guide", pages: 52, size: "8.9 MB", lang: "EN", downloads: 1890, updated: "2026-04", toc: ["Heat Transfer", "U-Value", "Condensation", "Thermal Bridges", "Energy Savings"], keywords: ["energy","u-value","thermal"] },
  { id: "automation-white-paper", title: "Automation in Panel Production — 2026", desc: "PLC, SCADA, vision inspection and MES integration for modern sandwich panel factories.", cover: aiAssistant, category: "Automation", type: "White Paper", pages: 44, size: "7.6 MB", lang: "EN", downloads: 1310, updated: "2026-06", toc: ["Line Automation", "PLC & SCADA", "Vision Inspection", "MES Integration", "Data & AI"], keywords: ["automation","plc","scada"] },
  { id: "rockwool-technology", title: "Rock Wool Technology — Engineering Reference", desc: "Fiber orientation, density, binder chemistry and performance of rock wool sandwich panels.", cover: rawMaterials, category: "Rock Wool Technology", type: "Engineering Guide", pages: 38, size: "6.1 MB", lang: "EN", downloads: 1440, updated: "2026-03", toc: ["Fiber Orientation", "Density Grades", "Binder Chemistry", "Testing", "Applications"], keywords: ["rockwool","fiber","density"] },
  { id: "project-inquiry-playbook", title: "Project Inquiry Playbook", desc: "What data your engineers must prepare before submitting a factory or panel inquiry — checklists and templates.", cover: projectInquiry, category: "Engineering Consultancy", type: "Project Template", pages: 28, size: "3.9 MB", lang: "EN · AR", downloads: 1120, updated: "2026-05", toc: ["Site Data", "Capacity Targets", "Utility Assumptions", "Budget Range", "Timeline"], keywords: ["inquiry","project","template"] },
  { id: "capex-calculation-sheet", title: "CAPEX Calculation Sheet (Excel)", desc: "Editable CAPEX model with land, building, line, utilities, MHE and commissioning line items.", cover: factoryInvestment, category: "Factory Investment", type: "Calculation Sheet", pages: 6, size: "1.2 MB", lang: "EN", downloads: 5820, updated: "2026-06", toc: ["Land", "Building", "Line", "Utilities", "MHE", "Commissioning"], keywords: ["capex","excel","budget"] },
  { id: "brand-guidelines", title: "NEVO Industrial — Brand Guidelines", desc: "Logo system, color palette, typography, imagery and application guidelines for partners.", cover: brandGuidelines, category: "Factory Development", type: "Product Brochure", pages: 34, size: "4.8 MB", lang: "EN", downloads: 890, updated: "2026-01", toc: ["Logo System", "Color Palette", "Typography", "Imagery", "Applications"], keywords: ["brand","identity"] },

  // CAD & BIM
  { id: "cad-panel-library-dwg", title: "Sandwich Panel CAD Library (DWG)", desc: "AutoCAD DWG library of standard PIR and rock wool panel sections, joints, corners, flashings and details.", cover: panelThickness, category: "CAD & BIM", type: "CAD File", pages: 0, size: "42.6 MB", lang: "EN", downloads: 6120, updated: "2026-06", featured: true, toc: ["Panel Sections","Joints & Overlaps","Corner Details","Flashings","Openings"], keywords: ["cad","dwg","autocad","details"] },
  { id: "cad-panel-library-dxf", title: "Panel Detail Pack (DXF)", desc: "DXF exports of standard panel joints, thermal breaks and fastening details for laser and CNC workflows.", cover: productConfigurator, category: "CAD & BIM", type: "CAD File", pages: 0, size: "18.9 MB", lang: "EN", downloads: 2410, updated: "2026-05", toc: ["Joints","Thermal Breaks","Fastenings"], keywords: ["dxf","cnc","laser"] },
  { id: "cad-machine-step", title: "Production Line 3D Models (STEP / IGES)", desc: "3D STEP and IGES models of laminator, mixing station, cutting saw and stacker for plant integration studies.", cover: productionLines, category: "CAD & BIM", type: "CAD File", pages: 0, size: "126.4 MB", lang: "EN", downloads: 1680, updated: "2026-05", toc: ["Laminator","Mixing Head","Cutting Saw","Stacker"], keywords: ["step","iges","solidworks","3d"] },
  { id: "bim-revit-families", title: "Revit Families — Panels & Systems (RVT)", desc: "Parametric Revit families for wall and roof sandwich panels — LOD 300, with thermal and acoustic parameters.", cover: factoryLayout, category: "CAD & BIM", type: "BIM File", pages: 0, size: "58.2 MB", lang: "EN", downloads: 3480, updated: "2026-06", featured: true, toc: ["Wall Panels","Roof Panels","Cold Storage","Parameters"], keywords: ["bim","revit","families","lod300"] },
  { id: "bim-3d-pdf", title: "Factory 3D PDF (Interactive)", desc: "Interactive 3D PDF of a reference sandwich panel factory — rotate, section and inspect line layout.", cover: factoryLayout, category: "CAD & BIM", type: "BIM File", pages: 4, size: "22.1 MB", lang: "EN", downloads: 1290, updated: "2026-04", toc: ["Line Layout","Warehouse","Utilities","Office"], keywords: ["3d pdf","interactive","factory"] },

  // Certifications
  { id: "cert-iso-9001", title: "ISO 9001:2015 — Quality Management", desc: "NEVO Industrial ISO 9001 quality management system certificate — issued by an accredited body.", cover: performanceAnalytics, category: "Certifications", type: "Certificate", pages: 2, size: "0.9 MB", lang: "EN", downloads: 3120, updated: "2026-02", toc: ["Scope","Standard","Validity"], keywords: ["iso","9001","quality"] },
  { id: "cert-iso-14001", title: "ISO 14001:2015 — Environmental Management", desc: "Environmental management system certification covering panel production and factory operations.", cover: performanceAnalytics, category: "Certifications", type: "Certificate", pages: 2, size: "0.8 MB", lang: "EN", downloads: 1980, updated: "2026-02", toc: ["Scope","Standard","Validity"], keywords: ["iso","14001","environment"] },
  { id: "cert-ce-panels", title: "CE Marking — Sandwich Panels (EN 14509)", desc: "Declaration of Performance and CE marking documentation per EN 14509 for insulated sandwich panels.", cover: pirVsRockwool, category: "Certifications", type: "Certificate", pages: 6, size: "1.4 MB", lang: "EN", downloads: 2760, updated: "2026-03", toc: ["DoP","EN 14509","Performance Table"], keywords: ["ce","en14509","dop"] },
  { id: "report-fire-en13501", title: "Fire Test Report — EN 13501-1", desc: "Reaction-to-fire classification report for PIR and rock wool sandwich panels per EN 13501-1.", cover: pirVsRockwool, category: "Certifications", type: "Test Report", pages: 18, size: "3.6 MB", lang: "EN", downloads: 2340, updated: "2026-04", toc: ["Test Method","Classification","B-s1,d0","A2-s1,d0"], keywords: ["fire","en13501","test report"] },
  { id: "report-thermal", title: "Thermal Performance Report (U-Value)", desc: "Guarded hot-plate test results and calculated U-values across thickness range for PIR and rock wool.", cover: performanceAnalytics, category: "Certifications", type: "Test Report", pages: 22, size: "4.1 MB", lang: "EN", downloads: 2010, updated: "2026-05", toc: ["Test Setup","Thermal Conductivity","U-Value Table"], keywords: ["thermal","u-value","test report"] },
  { id: "report-load", title: "Structural Load Test Report", desc: "Panel span, deflection and wind load test data per EN 14509 Annex A for design engineers.", cover: performanceAnalytics, category: "Certifications", type: "Test Report", pages: 26, size: "5.2 MB", lang: "EN", downloads: 1540, updated: "2026-05", toc: ["Bending","Wind Load","Point Load","Span Tables"], keywords: ["load","structural","span"] },

  // Manuals
  { id: "manual-line-operation", title: "Production Line — Operation Manual", desc: "Complete operator manual for continuous sandwich panel lines: startup, recipes, changeover, shutdown.", cover: continuousPir, category: "Maintenance", type: "Operation Manual", pages: 148, size: "22.4 MB", lang: "EN · AR", downloads: 2680, updated: "2026-06", toc: ["Startup","Recipes","Changeover","Shutdown","Alarms"], keywords: ["operation","operator","line"] },
  { id: "manual-commissioning", title: "Commissioning Guide — Sandwich Panel Line", desc: "Step-by-step commissioning protocol: mechanical, electrical, PLC/SCADA, FAT and SAT sign-off.", cover: productionOverview, category: "Installation", type: "Commissioning Guide", pages: 74, size: "11.8 MB", lang: "EN", downloads: 1420, updated: "2026-05", toc: ["Mechanical","Electrical","PLC/SCADA","FAT","SAT"], keywords: ["commissioning","fat","sat"] },
  { id: "manual-troubleshoot", title: "Troubleshooting Guide — Line & Panels", desc: "Systematic troubleshooting for line stoppages, quality deviations, chemical mixing and cutting issues.", cover: engineeringSolutions, category: "Maintenance", type: "Troubleshooting Guide", pages: 62, size: "9.4 MB", lang: "EN", downloads: 1830, updated: "2026-05", toc: ["Line Stops","Quality Deviations","Mixing Issues","Cutting Defects"], keywords: ["troubleshoot","defects","issues"] },
  { id: "manual-safety", title: "Safety Manual — Factory Operations", desc: "HSE manual covering LOTO, PPE, chemical handling, hot work and emergency procedures for panel factories.", cover: engineeringConsultancy, category: "Quality Control", type: "Safety Manual", pages: 88, size: "13.2 MB", lang: "EN · AR", downloads: 2110, updated: "2026-04", toc: ["LOTO","PPE","Chemicals","Hot Work","Emergency"], keywords: ["safety","hse","loto","ppe"] },
];

const CATEGORIES: Category[] = [
  "Factory Development","Production Lines","Engineering Consultancy","Factory Investment",
  "Raw Materials","Finished Sandwich Panels","PIR Technology","Rock Wool Technology",
  "Automation","Installation","Maintenance","Quality Control","Energy Efficiency",
  "Fire Performance","Cold Storage","Clean Rooms","Industrial Buildings",
  "CAD & BIM","Certifications",
];

const DOC_TYPES: DocType[] = [
  "Engineering Guide","Technical Catalog","Product Brochure","Factory Planning Book",
  "Technical Datasheet","Calculation Sheet","Engineering Checklist","Maintenance Manual",
  "Installation Guide","Case Study","White Paper","Project Template",
  "CAD File","BIM File","Certificate","Test Report",
  "Operation Manual","Commissioning Guide","Safety Manual","Troubleshooting Guide",
];

const CATEGORY_ICONS: Record<Category, typeof Factory> = {
  "Factory Development": Factory, "Production Lines": Cog, "Engineering Consultancy": Wrench,
  "Factory Investment": LineChart, "Raw Materials": PackageSearch, "Finished Sandwich Panels": Layers,
  "PIR Technology": Flame, "Rock Wool Technology": ShieldCheck, "Automation": Sparkles,
  "Installation": Building2, "Maintenance": Wrench, "Quality Control": ClipboardCheck,
  "Energy Efficiency": Zap, "Fire Performance": Flame, "Cold Storage": Snowflake,
  "Clean Rooms": ShieldCheck, "Industrial Buildings": Boxes,
  "CAD & BIM": Box, "Certifications": Award,
};

const FAQ = [
  { q: "Are these downloads free?", a: "Yes. All engineering guides, catalogs and calculation sheets are free after a short registration so our engineering team can follow up with technical support." },
  { q: "In what language are the documents?", a: "Core catalogs and guides are available in English and Arabic. Selected white papers are available in additional languages on request." },
  { q: "Can I request a custom technical document?", a: "Yes. Contact our engineering team with your project brief and we will prepare a project-specific dossier within 5–10 working days." },
  { q: "How often are the documents updated?", a: "All engineering documents are reviewed at least twice a year. Every download includes the last-updated date in its cover." },
  { q: "Can I share these documents inside my company?", a: "Yes, for internal engineering, procurement and management use. Redistribution outside your organization requires written approval from NEVO Industrial." },
];

const FILTER_TABS = ["Newest","Most Downloaded","Most Popular","Engineering","Products","Factory","Raw Materials","Consultancy"] as const;
type FilterTab = typeof FILTER_TABS[number];

/* ─────────────────────────────────────────────────────────────── */
/* Route                                                            */
/* ─────────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/$lang/download-center")({
  component: DownloadCenterPage,
  head: () => {
    const seo = buildSeo({
      lang: params.lang,
      title: "Download Center — Engineering Resources & Technical Library | NEVO",
      description:
        "Download professional engineering guides, factory planning books, technical catalogs, datasheets and calculation sheets for sandwich panel factories, production lines and raw materials.",
      path: "/download-center",
    });
    return {
      meta: seo.meta,
      links: seo.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(orgJsonLd()) },
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Knowledge", path: "/knowledge-hub" },
              { name: "Download Center", path: "/download-center" },
            ]),
          ),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "NEVO Engineering Download Center",
            hasPart: DOCS.slice(0, 12).map((d) => ({
              "@type": "DigitalDocument",
              name: d.title,
              description: d.desc,
              inLanguage: d.lang,
              numberOfPages: d.pages,
              genre: d.type,
              about: d.category,
            })),
          }),
        },
      ],
    };
  },
});

/* ─────────────────────────────────────────────────────────────── */
/* Page                                                             */
/* ─────────────────────────────────────────────────────────────── */

function DownloadCenterPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [activeType, setActiveType] = useState<DocType | "All">("All");
  const [tab, setTab] = useState<FilterTab>("Newest");
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [downloadDoc, setDownloadDoc] = useState<Doc | null>(null);

  const filtered = useMemo(() => {
    let list = DOCS.slice();
    const q = query.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    if (tokens.length) {
      list = list.filter((d) => {
        const hay = `${d.title} ${d.desc} ${d.category} ${d.type} ${(d.keywords || []).join(" ")}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }
    if (activeCategory !== "All") list = list.filter((d) => d.category === activeCategory);
    if (activeType !== "All") list = list.filter((d) => d.type === activeType);

    switch (tab) {
      case "Newest": list.sort((a, b) => b.updated.localeCompare(a.updated)); break;
      case "Most Downloaded":
      case "Most Popular": list.sort((a, b) => b.downloads - a.downloads); break;
      case "Engineering": list = list.filter((d) => ["Engineering Guide","White Paper","Engineering Checklist","Calculation Sheet"].includes(d.type)); break;
      case "Products": list = list.filter((d) => ["Product Brochure","Technical Catalog","Technical Datasheet"].includes(d.type)); break;
      case "Factory": list = list.filter((d) => ["Factory Development","Factory Investment","Production Lines","Automation"].includes(d.category)); break;
      case "Raw Materials": list = list.filter((d) => d.category === "Raw Materials"); break;
      case "Consultancy": list = list.filter((d) => d.category === "Engineering Consultancy"); break;
    }
    return list;
  }, [query, activeCategory, activeType, tab]);

  const featured = DOCS.filter((d) => d.featured);
  const totalDownloads = DOCS.reduce((s, d) => s + d.downloads, 0);

  return (
    <div className="min-h-screen bg-[#0a0d10] text-white">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden pt-40 pb-24 border-b border-white/5">
        <div className="absolute inset-0 -z-10">
          <img loading="lazy" decoding="async" src={heroImg.url} alt="" className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0d10] via-[#0a0d10]/70 to-[#0a0d10]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <Breadcrumbs />
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mt-8 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-emerald-300">
              <Download className="h-3.5 w-3.5" /> Engineering Library · {DOCS.length} Documents
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
              Engineering Resources <span className="text-emerald-400">& Technical Library</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
              Download professional engineering documents, factory planning books, technical
              specifications and calculation sheets developed by NEVO Engineering — for investors,
              engineers, consultants, architects and factory owners.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#library" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-medium text-[#0a0d10] transition">
                Browse Resources <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#featured" className="inline-flex items-center gap-2 rounded-lg border border-white/15 hover:border-emerald-500/50 hover:bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition">
                Download Guides <Download className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
              {[
                { k: `${DOCS.length}+`, v: "Engineering documents" },
                { k: `${(totalDownloads / 1000).toFixed(0)}K+`, v: "Total downloads" },
                { k: "17", v: "Categories" },
                { k: "2 langs", v: "EN · AR active" },
              ].map((s) => (
                <div key={s.v} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-2xl font-semibold text-emerald-400">{s.k}</div>
                  <div className="text-xs mt-1 text-white/60">{s.v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEARCH BAR */}
      <section className="sticky top-16 z-30 border-b border-white/5 bg-[#0a0d10]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, category, keyword, industry, document type…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <select value={activeType} onChange={(e) => setActiveType(e.target.value as DocType | "All")}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <option value="All">All document types</option>
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value as Category | "All")}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {/* FORMAT HUBS — CAD · CERTIFICATIONS · MANUALS */}
      <section className="border-b border-white/5 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            eyebrow="Engineering Format Hubs"
            title="CAD, Certifications & Manuals"
            desc="Three specialised libraries — engineered drawings, formal certificates and operational manuals — the same standard investors expect from Siemens, ABB or Bosch Rexroth."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Box,
                title: "CAD & BIM Library",
                desc: "DWG, DXF, STEP, IGES, SolidWorks and Revit families for panels, joints and complete production lines.",
                formats: ["DWG","DXF","STEP","IGES","RVT","3D PDF"],
                filter: "CAD & BIM" as Category,
              },
              {
                icon: Award,
                title: "Certification Center",
                desc: "ISO 9001, ISO 14001, CE / EN 14509, fire, thermal and structural load test reports — accredited & downloadable.",
                formats: ["ISO 9001","ISO 14001","CE","EN 13501","EN 14509"],
                filter: "Certifications" as Category,
              },
              {
                icon: HardHat,
                title: "Operational Manuals",
                desc: "Installation, operation, maintenance, troubleshooting, commissioning and safety manuals for every line we deliver.",
                formats: ["Installation","Operation","Maintenance","Commissioning","Safety"],
                filter: null,
              },
            ].map((h) => {
              const Icon = h.icon;
              const count = h.filter
                ? DOCS.filter((d) => d.category === h.filter).length
                : DOCS.filter((d) => ["Installation Guide","Operation Manual","Maintenance Manual","Commissioning Guide","Safety Manual","Troubleshooting Guide"].includes(d.type)).length;
              return (
                <button
                  key={h.title}
                  onClick={() => {
                    if (h.filter) {
                      setActiveCategory(h.filter);
                      setActiveType("All");
                    } else {
                      setActiveCategory("All");
                      setActiveType("Operation Manual");
                    }
                    setTab("Newest");
                    setTimeout(() => {
                      document.getElementById("library")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 60);
                  }}
                  className="group text-left relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-8 hover:border-emerald-500/40 hover:from-emerald-500/[0.06] transition"
                >
                  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_60%)] opacity-0 group-hover:opacity-100 transition" />
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                      {count} files
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-tight group-hover:text-emerald-300 transition">
                    {h.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{h.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {h.formats.map((f) => (
                      <span
                        key={f}
                        className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/60"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                    Open library <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-white/5 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead eyebrow="Resource categories" title="Explore the engineering library" desc={`${CATEGORIES.length} categories covering every stage of factory development, production and operation.`} />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <CategoryCard label="All resources" icon={Library} active={activeCategory === "All"} onClick={() => setActiveCategory("All")} count={DOCS.length} />
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const count = DOCS.filter((d) => d.category === c).length;
              return (
                <CategoryCard key={c} label={c} icon={Icon} count={count}
                  active={activeCategory === c}
                  onClick={() => { setActiveCategory(c); window.scrollTo({ top: document.getElementById("library")?.offsetTop ?? 0, behavior: "smooth" }); }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section id="featured" className="border-b border-white/5 py-20 bg-gradient-to-b from-transparent via-white/[0.015] to-transparent">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead eyebrow="Featured downloads" title="Most-requested engineering resources" desc="Curated by our engineers — the guides investors and factory owners open first." />
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {featured.map((d) => (
              <FeaturedCard key={d.id} doc={d} onPreview={() => setPreviewDoc(d)} onDownload={() => setDownloadDoc(d)} />
            ))}
          </div>
        </div>
      </section>

      {/* LIBRARY */}
      <section id="library" className="py-20 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <SectionHead eyebrow="Full library" title={`${filtered.length} documents available`} desc="Filter by category, type or intent. Download unlimited." compact />
            <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {FILTER_TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                  tab === t ? "border-emerald-500 bg-emerald-500 text-[#0a0d10]" : "border-white/10 text-white/70 hover:border-white/20 hover:bg-white/[0.03]"
                }`}>{t}</button>
            ))}
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <DocCard key={d.id} doc={d} onPreview={() => setPreviewDoc(d)} onDownload={() => setDownloadDoc(d)} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center text-white/60">
                No documents match your filters. <button className="text-emerald-400 hover:underline" onClick={() => { setQuery(""); setActiveCategory("All"); setActiveType("All"); setTab("Newest"); }}>Reset</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DOCUMENT TYPES */}
      <section className="py-20 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead eyebrow="Document types" title="Every format an engineer needs" desc="From single-page datasheets to 128-page factory planning books." />
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {DOC_TYPES.map((t) => {
              const count = DOCS.filter((d) => d.type === t).length;
              return (
                <button key={t} onClick={() => setActiveType(t)}
                  className={`text-left rounded-xl border p-4 transition ${
                    activeType === t ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}>
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <div className="mt-3 text-sm font-medium">{t}</div>
                  <div className="mt-1 text-xs text-white/50">{count} document{count !== 1 ? "s" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* RELATED CONTENT */}
      <section className="py-20 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead eyebrow="Related content" title="Continue your engineering research" />
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { title: "Engineering Articles", desc: "Deep-dives from our senior engineers.", href: "/knowledge-hub", icon: BookOpen },
              { title: "Finished Panels", desc: "Product catalog for cold, food, industrial.", href: "/solutions/sandwich-panels", icon: Layers },
              { title: "Engineering Consultancy", desc: "Feasibility, design, procurement, commissioning.", href: "/solutions/engineering-consultancy", icon: Wrench },
              { title: "Industries We Serve", desc: "40+ markets, 12+ verticals.", href: "/industries", icon: Building2 },
              { title: "AI Engineering Assistant", desc: "Ask a senior engineer anything, 24/7.", href: "/ai-assistant", icon: Sparkles },
            ].map((r) => {
              const Icon = r.icon;
              return (
                <Link key={r.href} to={r.href} className="group rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-emerald-500/40 hover:bg-white/[0.04] transition">
                  <Icon className="h-5 w-5 text-emerald-400" />
                  <div className="mt-3 font-medium text-sm group-hover:text-emerald-300 transition">{r.title}</div>
                  <div className="mt-1 text-xs text-white/60 leading-relaxed">{r.desc}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400"><ArrowRight className="h-3.5 w-3.5" /> Open</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-b border-white/5">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHead eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-10 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.02]">
            {FAQ.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img loading="lazy" decoding="async" src={futureHero.url} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d10] via-[#0a0d10]/70 to-[#0a0d10]/40" />
        </div>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono uppercase tracking-widest text-emerald-300">
            <MessageSquare className="h-3.5 w-3.5" /> Engineering support
          </div>
          <h2 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
            Need more than a guide?
          </h2>
          <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
            Our engineering team can help you plan, design and build your complete
            sandwich panel factory — from feasibility to commissioning.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/ai-assistant" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-sm font-medium text-[#0a0d10] transition">
              <PhoneCall className="h-4 w-4" /> Talk to an Engineer
            </Link>
            <Link to="/project-inquiry" className="inline-flex items-center gap-2 rounded-lg border border-white/15 hover:border-emerald-500/50 hover:bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition">
              Request Engineering Proposal <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />

      <AnimatePresence>
        {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} onDownload={() => { setDownloadDoc(previewDoc); setPreviewDoc(null); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {downloadDoc && <DownloadModal doc={downloadDoc} onClose={() => setDownloadDoc(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Sub-components                                                   */
/* ─────────────────────────────────────────────────────────────── */

function Library(props: React.SVGProps<SVGSVGElement>) { return <BookOpen {...props} />; }

function Breadcrumbs() {
  return (
    <nav className="flex items-center gap-2 text-xs text-white/50 font-mono uppercase tracking-widest">
      <Link to="/" className="hover:text-emerald-400">Home</Link>
      <ChevronRight className="h-3 w-3" />
      <Link to="/knowledge-hub" className="hover:text-emerald-400">Knowledge</Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-white/80">Download Center</span>
    </nav>
  );
}

function SectionHead({ eyebrow, title, desc, compact = false }: { eyebrow: string; title: string; desc?: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "max-w-3xl"}>
      <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">{eyebrow}</div>
      <h2 className={`mt-3 font-semibold tracking-tight ${compact ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}>{title}</h2>
      {desc && <p className="mt-4 text-white/60 leading-relaxed max-w-2xl">{desc}</p>}
    </div>
  );
}

function CategoryCard({ label, icon: Icon, count, active, onClick }: { label: string; icon: any; count: number; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-xl border p-4 transition group ${
        active ? "border-emerald-500/60 bg-emerald-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"
      }`}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-emerald-400" />
        <span className="text-[10px] font-mono text-white/50">{count}</span>
      </div>
      <div className="mt-4 text-sm font-medium">{label}</div>
      <div className="mt-1 text-[11px] text-white/45 uppercase tracking-wider font-mono">Engineering docs</div>
    </button>
  );
}

function FeaturedCard({ doc, onPreview, onDownload }: { doc: Doc; onPreview: () => void; onDownload: () => void }) {
  const Icon = CATEGORY_ICONS[doc.category];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
      className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 transition">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img loading="lazy" decoding="async" src={doc.cover.url} alt={doc.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d10] via-[#0a0d10]/40 to-transparent" />
        <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 backdrop-blur px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-emerald-300">
          <Star className="h-3 w-3" /> Featured
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-[11px] font-mono text-white/70">
          <Icon className="h-3.5 w-3.5 text-emerald-400" /> {doc.category}
          <span className="opacity-40">·</span> {doc.type}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold leading-snug group-hover:text-emerald-300 transition">{doc.title}</h3>
        <p className="mt-3 text-sm text-white/60 leading-relaxed line-clamp-2">{doc.desc}</p>
        <div className="mt-5 grid grid-cols-4 gap-2 text-[11px] font-mono text-white/60">
          <Meta label="Pages" value={String(doc.pages)} />
          <Meta label="Size" value={doc.size} />
          <Meta label="Lang" value={doc.lang} />
          <Meta label="Updated" value={doc.updated} />
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={onDownload} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-sm font-medium text-[#0a0d10] transition">
            <Download className="h-4 w-4" /> Download
          </button>
          <button onClick={onPreview} className="rounded-lg border border-white/15 hover:border-emerald-500/40 px-4 py-2.5 text-sm text-white transition">
            Preview
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DocCard({ doc, onPreview, onDownload }: { doc: Doc; onPreview: () => void; onDownload: () => void }) {
  const Icon = CATEGORY_ICONS[doc.category];
  return (
    <div className="group flex flex-col rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-white/[0.04] transition">
      <button onClick={onPreview} className="relative aspect-[16/10] overflow-hidden text-left">
        <img loading="lazy" decoding="async" src={doc.cover.url} alt={doc.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d10]/90 via-[#0a0d10]/20 to-transparent" />
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded border border-white/15 bg-black/50 backdrop-blur px-2 py-0.5 text-[10px] font-mono text-white/80">
          <Icon className="h-3 w-3 text-emerald-400" /> {doc.category}
        </div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded border border-white/15 bg-black/60 backdrop-blur px-2 py-0.5 text-[10px] font-mono text-white/80">
          <TrendingUp className="h-3 w-3 text-emerald-400" /> {doc.downloads.toLocaleString()}
        </div>
      </button>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">{doc.type}</div>
        <h3 className="mt-2 text-base font-semibold leading-snug line-clamp-2 group-hover:text-emerald-300 transition">{doc.title}</h3>
        <p className="mt-2 text-xs text-white/55 leading-relaxed line-clamp-2">{doc.desc}</p>
        <div className="mt-4 flex items-center gap-3 text-[10px] font-mono text-white/50">
          <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> {doc.pages}p</span>
          <span>{doc.size}</span>
          <span className="inline-flex items-center gap-1"><Globe2 className="h-3 w-3" /> {doc.lang}</span>
          <span className="inline-flex items-center gap-1 ml-auto"><Clock className="h-3 w-3" /> {doc.updated}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onDownload} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-medium text-[#0a0d10] transition">
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <button onClick={onPreview} className="rounded-md border border-white/15 hover:border-emerald-500/40 px-3 py-2 text-xs text-white transition">
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[0.02] p-2">
      <div className="text-[9px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="mt-0.5 text-white/85">{value}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-5">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <span className="font-medium">{q}</span>
        <ChevronRight className={`h-4 w-4 text-emerald-400 transition ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <p className="mt-3 text-sm text-white/60 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Preview + Download Modals                                        */
/* ─────────────────────────────────────────────────────────────── */

function PreviewModal({ doc, onClose, onDownload }: { doc: Doc; onClose: () => void; onDownload: () => void }) {
  const related = DOCS.filter((d) => d.id !== doc.id && (d.category === doc.category || d.type === doc.type)).slice(0, 3);
  const Icon = CATEGORY_ICONS[doc.category];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-5xl rounded-2xl border border-white/10 bg-[#0d1114] overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[600px]">
            <img loading="lazy" decoding="async" src={doc.cover.url} alt={doc.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1114] via-transparent to-transparent" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/15 backdrop-blur px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-emerald-300">
              <Icon className="h-3.5 w-3.5" /> {doc.category}
            </div>
          </div>
          <div className="p-8 overflow-y-auto max-h-[80vh]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">{doc.type}</div>
                <h3 className="mt-2 text-2xl font-semibold leading-tight">{doc.title}</h3>
              </div>
              <button onClick={onClose} className="rounded-lg border border-white/10 p-2 hover:border-white/25 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">{doc.desc}</p>

            <div className="mt-5 grid grid-cols-4 gap-2 text-[11px] font-mono text-white/60">
              <Meta label="Pages" value={String(doc.pages)} />
              <Meta label="Size" value={doc.size} />
              <Meta label="Lang" value={doc.lang} />
              <Meta label="Updated" value={doc.updated} />
            </div>

            <div className="mt-6">
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">Table of contents</div>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                {doc.toc.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{i + 1}. {t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {related.length > 0 && (
              <div className="mt-6">
                <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">Related downloads</div>
                <div className="mt-3 space-y-2">
                  {related.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-white/10 p-3 bg-white/[0.02]">
                      <img loading="lazy" decoding="async" src={r.cover.url} alt="" className="h-12 w-12 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        <div className="text-[11px] text-white/50 font-mono">{r.type} · {r.pages}p</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onDownload} className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#0a0d10] transition">
              <Download className="h-4 w-4" /> Download PDF · {doc.size}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DownloadModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", country: "", email: "", phone: "", projectType: "", reason: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d1114] overflow-hidden">
        <div className="p-6 flex items-start gap-4 border-b border-white/10">
          <img loading="lazy" decoding="async" src={doc.cover.url} alt="" className="h-20 w-16 rounded object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">{doc.type}</div>
            <div className="mt-1 font-semibold leading-snug">{doc.title}</div>
            <div className="mt-2 text-[11px] font-mono text-white/50">{doc.pages}p · {doc.size} · {doc.lang}</div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-2 hover:border-white/25 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-white/70">
              Please share a few details so our engineering team can support your project. You will
              receive the document immediately after submission.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Company *" value={form.company} onChange={(v) => setForm({ ...form, company: v })} required />
              <Field label="Country *" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
              <Field label="Work email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Select label="Project type *" value={form.projectType} onChange={(v) => setForm({ ...form, projectType: v })} required
                options={["New factory", "Line upgrade", "Raw material sourcing", "Consultancy", "Panel purchase", "Research / Study"]} />
            </div>
            <Select label="Reason for download *" value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} required
              options={["Feasibility study", "Investment decision", "Technical specification", "Procurement", "Academic research", "General interest"]} />
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#0a0d10] transition">
              <Download className="h-4 w-4" /> Unlock & Download
            </button>
            <p className="text-[11px] text-white/40 text-center">
              By downloading you agree to receive occasional engineering updates from NEVO. Unsubscribe anytime.
            </p>
          </form>
        ) : (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Your download is unlocked</h3>
            <p className="mt-2 text-sm text-white/60">
              We have sent <span className="text-white/85">{doc.title}</span> to <span className="text-emerald-400">{form.email}</span>.
              A NEVO engineer will reach out within one working day.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={onClose}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2.5 text-sm font-medium text-[#0a0d10] transition">
                <Download className="h-4 w-4" /> Download now
              </button>
              <button onClick={onClose} className="rounded-lg border border-white/15 px-5 py-2.5 text-sm">Close</button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-white/60">{label}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        maxLength={200}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50" />
    </label>
  );
}

function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[11px] font-mono uppercase tracking-widest text-white/60">{label}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50">
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
