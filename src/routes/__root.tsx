import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Link } from "@/components/site/LocalizedLink";
import { useEffect, type ReactNode } from "react";
import {
  BookOpen,
  Calculator,
  ClipboardList,
  ArrowRight,
  Home,
} from "lucide-react";

import appCss from "../styles.css?url";
import nevoLogoDark from "@/assets/nevo-logo-dark.png";
import nevoLogoLight from "@/assets/nevo-logo-light.png";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AIAssistantLauncher } from "../components/site/AIAssistantLauncher";
import { Analytics } from "../components/site/Analytics";
import { CookieConsent } from "../components/site/CookieConsent";
import { StickyMobileCTA } from "../components/site/StickyMobileCTA";
import { Toaster } from "../components/ui/sonner";
import { orgJsonLd, websiteJsonLd, ldScript, hreflangLinks } from "../lib/seo";
import { LanguageProvider } from "../i18n/LanguageProvider";
import "../i18n/config";

import { useTranslation } from "react-i18next";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
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
            <img loading="lazy" decoding="async"
              src={nevoLogoDark}
              alt="NEVO Industrial"
              className="h-7 w-auto dark:hidden"
            />
            <img loading="lazy" decoding="async"
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
            <p className="text-body-lg mx-auto max-w-2xl">
              {t("errors.notFoundBody")}
            </p>

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
                <p className="text-small">
                  Technical guides, FAQs, and academy courses.
                </p>
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
                <p className="text-small">
                  20+ calculators for panels, loads, and energy.
                </p>
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
                <p className="text-small">
                  Get a tailored project estimate in 24 hours.
                </p>
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
        <p className="mt-3 text-sm text-muted-foreground">
          {t("errors.systemBody")}
        </p>
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

const SITE_TITLE =
  "NEVO Industrial — Sandwich Panel Engineering, Raw Materials & Production Lines";
const SITE_DESCRIPTION =
  "Dubai-based industrial engineering & supply company. Factory development, engineering consultancy, PIR/PUR raw materials, production lines and finished sandwich panels for global markets.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "NEVO Industrial" },
      { property: "og:site_name", content: "NEVO Industrial" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
      ...hreflangLinks("/"),
    ],
    scripts: [
      ldScript(orgJsonLd()),
      ldScript(websiteJsonLd()),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <AIAssistantLauncher />
        <StickyMobileCTA />
        <CookieConsent />
        <Analytics />
        <Toaster position="top-right" richColors closeButton />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
