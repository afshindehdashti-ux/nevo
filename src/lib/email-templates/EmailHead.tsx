import * as React from "react";
import { Head } from "@react-email/components";
import { brand } from "./_shared";

// Dark-mode-aware <Head> for every NEVO email template.
// - Declares color-scheme so Apple Mail / iOS Mail render in true dark mode
//   instead of forcibly inverting colors.
// - Provides @media (prefers-color-scheme: dark) overrides for Apple Mail,
//   iOS Mail, Outlook 2019+ (macOS/Windows), and Thunderbird.
// - Provides [data-ogsc] / [data-ogsb] overrides for Outlook.com web/app.
// - Swaps the dark-text logo for a white variant so it stays legible on a
//   dark background, and keeps body copy readable at all times.
const darkModeCss = `
  /* Neutralize Gmail Android auto-dark on the wordmark by keeping colors explicit */
  u + .body .nevo-brand-mark,
  u + .body .nevo-brand-tagline { color: inherit !important; }

  @media (prefers-color-scheme: dark) {
    body, .body { background-color: #0B1220 !important; }
    .card { background-color: #111827 !important; border-color: #1F2937 !important; }
    .code-box { background-color: #0B1220 !important; border-color: #1F2937 !important; color: #F8FAFC !important; }
    .h1, .text, .brand-mark, .row-value { color: #F8FAFC !important; }
    .brand-tagline, .small, .footer-text, .row-label { color: #94A3B8 !important; }
    .header { border-bottom-color: #1F2937 !important; }
    .footer-wrap { border-top-color: #1F2937 !important; }
    .link { color: #34D399 !important; }
    .button { background-color: #F8FAFC !important; color: #0B1220 !important; }
    .nevo-logo-light { display: none !important; }
    .nevo-logo-dark { display: block !important; }
  }

  /* Outlook.com (web + Windows app) dark mode */
  [data-ogsc] body, [data-ogsc] .body { background-color: #0B1220 !important; }
  [data-ogsb] .card { background-color: #111827 !important; }
  [data-ogsc] .card { border-color: #1F2937 !important; }
  [data-ogsc] .code-box { background-color: #0B1220 !important; border-color: #1F2937 !important; color: #F8FAFC !important; }
  [data-ogsc] .h1, [data-ogsc] .text, [data-ogsc] .brand-mark, [data-ogsc] .row-value { color: #F8FAFC !important; }
  [data-ogsc] .brand-tagline, [data-ogsc] .small, [data-ogsc] .footer-text, [data-ogsc] .row-label { color: #94A3B8 !important; }
  [data-ogsc] .header { border-bottom-color: #1F2937 !important; }
  [data-ogsc] .footer-wrap { border-top-color: #1F2937 !important; }
  [data-ogsc] .link { color: #34D399 !important; }
  [data-ogsb] .button { background-color: #F8FAFC !important; }
  [data-ogsc] .button { color: #0B1220 !important; }
  [data-ogsc] .nevo-logo-light { display: none !important; }
  [data-ogsc] .nevo-logo-dark { display: block !important; }
`;

export const EmailHead = () => (
  <Head>
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <meta name="x-apple-brand-color" content={brand.primary} />
    <style type="text/css" dangerouslySetInnerHTML={{ __html: darkModeCss }} />
  </Head>
);

export default EmailHead;
