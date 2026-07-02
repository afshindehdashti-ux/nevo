import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";

export const Route = createFileRoute("/$lang/privacy")({
  head: ({ params }) => ({
    meta: [
      { title: "Privacy Policy — NEVO Industrial" },
      {
        name: "description",
        content:
          "How NEVO Industrial collects, uses, stores, and protects personal data across our engineering platform, calculators, and customer portals.",
      },
      { property: "og:title", content: "Privacy Policy — NEVO Industrial" },
      {
        property: "og:description",
        content:
          "How NEVO Industrial handles personal data, cookies, and inquiries submitted through our platform.",
      },
      { property: "og:url", content: `${SITE.url}/${params.lang}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/${params.lang}/privacy` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-foreground">
      <h1 className="mb-2 text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted-foreground">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">1. Who we are</h2>
          <p>
            NEVO Industrial ("NEVO", "we", "us") is an engineering and industrial group
            headquartered in Dubai, UAE. This policy explains how we handle personal data
            collected through our website, calculators, download center, and customer or
            partner portals.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">2. Data we collect</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Contact details you submit through inquiry forms, downloads, or callbacks.</li>
            <li>Project parameters entered into calculators or configurators.</li>
            <li>Account data for the customer and partner portals.</li>
            <li>Technical data (IP address, device, browser, pages viewed) via essential and optional analytics cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">3. How we use it</h2>
          <p>
            We use personal data to respond to inquiries, deliver quotations, provide
            engineering documentation, operate portals, improve our platform, and comply
            with legal obligations. We do not sell personal data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">4. Cookies</h2>
          <p>
            We use essential cookies required for the site to function and optional analytics
            cookies to understand usage. You can accept or decline optional cookies via the
            consent banner and change your choice at any time by clearing site data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">5. Sharing</h2>
          <p>
            We share data only with service providers who help operate our platform
            (hosting, analytics, email delivery), and with NEVO group entities involved in
            delivering your project. All processors are bound by confidentiality obligations.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">6. Your rights</h2>
          <p>
            Subject to applicable law, you may request access, correction, deletion, or
            portability of your personal data, and object to certain processing. To exercise
            your rights, contact{" "}
            <a href="mailto:privacy@nevoindustrial.com" className="underline">
              privacy@nevoindustrial.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold text-foreground">7. Contact</h2>
          <p>
            NEVO Industrial — Dubai, United Arab Emirates.{" "}
            <a href="/contact" className="underline">
              Get in touch
            </a>{" "}
            with any questions about this policy.
          </p>
        </section>
      </div>
    </main>
  );
}
