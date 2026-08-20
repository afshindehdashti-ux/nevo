import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useIsBackend } from "@/lib/use-route-area";
import { Link } from "@/components/site/LocalizedLink";
import { useEffect, type ReactNode } from "react";
import { BookOpen, Calculator, ClipboardList, ArrowRight, Home } from "lucide-react";

import appCss from "../styles.css?url";
import nevoLogoDark from "@/assets/nevo-logo-dark.png";
import nevoLogoLight from "@/assets/nevo-logo-light.png";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AIAssistantLauncher } from "../components/site/AIAssistantLauncher";
import { Analytics } from "../components/site/Analytics";
import { ClientMonitor } from "../components/site/ClientMonitor";
import { MaintenanceBanner } from "../components/site/MaintenanceBanner";
import { CookieConsent } from "../components/site/CookieConsent";
import { StickyMobileCTA } from "../components/site/StickyMobileCTA";
import { ImageOverrideProvider } from "../components/site/ImageOverrideProvider";

import { Toaster } from "../components/ui/sonner";
import { orgJsonLd, websiteJsonLd, ldScript } from "../lib/seo";
import { LanguageProvider } from "../i18n/LanguageProvider";
import { DevOverlays } from "@/components/dev/DevOverlays";

import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  localeDir,
  type Locale,
} from "../i18n/config";
import "../i18n/config";
// Dev-only: exposes window.__nevoLogoDebug for validating sampling/throttle configs.
import "../lib/logo-telemetry-debug";

import { useTranslation } from "react-i18next";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <MaintenanceBanner />
      {/* Engineering grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Logo bar */}
      <header className="relative z-10 border-b border-border/60">
        <div className="container-wide flex h-16 items-center md:h-20">
          <Link
            to="/"
            className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              loading="lazy"
              decoding="async"
              src={nevoLogoDark}
              alt="NEVO Industrial"
              className="h-7 w-auto dark:hidden"
            />
            <img
              loading="lazy"
              decoding="async"
              src={nevoLogoLight}
              alt="NEVO Industrial"
              className="hidden h-7 w-auto dark:block"
            />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 items-center">
        <div className="container-wide w-full py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="eyebrow mb-4 text-accent">{t("errors.notFoundEyebrow")}</div>
            <h1 className="text-display mb-5">{t("errors.notFoundTitle")}</h1>
            <p className="text-body-lg mx-auto max-w-2xl">{t("errors.notFoundBody")}</p>

            {/* Direct link cards */}
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              <Link
                to="/knowledge-hub"
                className="group card-accent-line flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-panel transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="text-h3 mb-1">{t("knowledge.articles")}</h3>
                <p className="text-small">Technical guides, FAQs, and academy courses.</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
                  Explore
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/engineering-tools"
                className="group card-accent-line flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-panel transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Calculator className="h-5 w-5" />
                </div>
                <h3 className="text-h3 mb-1">{t("knowledge.tools")}</h3>
                <p className="text-small">20+ calculators for panels, loads, and energy.</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
                  Calculate
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>

              <Link
                to="/project-inquiry"
                className="group card-accent-line flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-panel transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <h3 className="text-h3 mb-1">{t("cta.requestQuotation")}</h3>
                <p className="text-small">Get a tailored project estimate in 24 hours.</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-accent">
                  Start inquiry
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>

            {/* Home CTA */}
            <div className="mt-12">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Home className="mr-2 h-4 w-4" />
                {t("cta.returnHome")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="eyebrow mb-4">{t("errors.systemEyebrow")}</div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("errors.systemTitle")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("errors.systemBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("cta.tryAgain")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            {t("errors.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

const SITE_TITLE = "NEVO Industrial — Sandwich Panel Engineering & Supply";
const SITE_DESCRIPTION =
  "Dubai-based engineering consultancy for sandwich panel factory development, production lines, and PIR/PUR raw materials worldwide.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Sitewide defaults only — per-route head() overrides title, description,
      // og:title, og:description, twitter:title, and twitter:description.
      // Do not add og:title / og:description / twitter:title / twitter:description here:
      // TanStack Router concatenates meta so duplicates from root + route ship both.
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "NEVO Industrial" },
      { property: "og:site_name", content: "NEVO Industrial" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0F172A" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "NEVO" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/nevo-favicon.png", type: "image/png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
      { rel: "dns-prefetch", href: "https://www.clarity.ms" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap",
      },
    ],
    scripts: [ldScript(orgJsonLd()), ldScript(websiteJsonLd())],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Derive the document language/direction from the URL locale segment so SSR
  // markup already matches what the client renders (no hydration mismatch and
  // correct RTL on the very first paint for /ar/*).
  const pathname = useRouterState({ select: (s: { location: { pathname: string } }) => s.location.pathname });
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  const lang = (SUPPORTED_LOCALES as readonly string[]).includes(seg ?? "")
    ? (seg as Locale)
    : DEFAULT_LOCALE;

  return (
    <html lang={lang} dir={localeDir(lang)}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Shared hook — subscribes to router state so the gate re-evaluates on
  // every client-side navigation. Layout-level components must use this
  // helper (not a local regex) to keep public/backend gating consistent.
  const isBackend = useIsBackend();
  // /connect is the QR-code digital business card — intentionally free of any
  // marketing chrome (Ask AI launcher, sticky mobile CTA).
  const isConnect = useRouterState({
    select: (s) => s.location.pathname.replace(/\/+$/, "") === "/connect",
  });

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        {/* Public marketing chrome — hidden on all admin/CRM/backoffice
            routes. Each component also self-gates via useIsBackend() so
            they cannot leak if a future parent forgets this wrapper. */}
        {!isBackend && (
          <>
            {!isConnect && (
              <>
                <AIAssistantLauncher />
                <StickyMobileCTA />
              </>
            )}
            <CookieConsent />
            <Analytics />
          </>
        )}
        <ClientMonitor />
        {/* Applies admin-uploaded photo replacements (Admin > Image library)
            to every rendered <img> without touching component code. */}
        <ImageOverrideProvider />

        {/* Dev-only overlays. Off by default — including local authenticated
            testing — unless explicitly enabled via VITE_DEV_OVERLAYS or
            localStorage["nevo:dev-overlays"]. See src/lib/dev-flags.ts. */}
        <DevOverlays />
        <Toaster position="top-right" richColors closeButton />

      </LanguageProvider>
    </QueryClientProvider>
  );
}

