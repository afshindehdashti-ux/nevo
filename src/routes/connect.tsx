import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Globe, Mail, MapPin } from "lucide-react";
import nevoLogoLight from "@/assets/nevo-logo-light.png";


export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Arsalan Manesh — NEVO INDUSTRIAL Digital Business Card" },
      {
        name: "description",
        content:
          "Connect with Arsalan Manesh, International Business Director at NEVO Trading and Consultancy L.L.C – FZ. WhatsApp, email or visit nevoindustrial.com.",
      },
      { property: "og:type", content: "profile" },
      { property: "og:title", content: "Arsalan Manesh — NEVO INDUSTRIAL" },
      {
        property: "og:description",
        content:
          "International Business Director — Strategic Trading & Consultancy Solutions. Tap to connect by WhatsApp, email or web.",
      },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Arsalan Manesh — NEVO INDUSTRIAL" },
      {
        name: "twitter:description",
        content:
          "International Business Director — Strategic Trading & Consultancy Solutions.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.nevoindustrial.com/connect" }],
  }),
  component: ConnectCard,
});

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.04 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.73 6.42L3.2 28.8l6.55-1.71a12.75 12.75 0 0 0 6.29 1.64h.01c7.05 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05a12.7 12.7 0 0 0-9.05-3.68Zm0 23.02h-.01a10.6 10.6 0 0 1-5.41-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.58 10.58 0 0 1-1.62-5.64c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.51 1.11 7.52 3.12a10.56 10.56 0 0 1 3.11 7.52c0 5.87-4.77 10.61-10.64 10.61Zm5.83-7.95c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.89-1.78-2.21-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.25 3.44 5.46 4.82.76.33 1.36.53 1.82.68.77.24 1.46.21 2.01.13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
    </svg>
  );
}

const CONTACTS = [
  {
    key: "whatsapp",
    href: "https://wa.me/971502426167",
    label: "WhatsApp",
    value: "+971 50 242 6167",
    external: true,
  },
  {
    key: "email",
    href: "mailto:arsalan@nevoindustrial.com",
    label: "Email",
    value: "arsalan@nevoindustrial.com",
    external: false,
  },
  {
    key: "website",
    href: "https://www.nevoindustrial.com/en",
    label: "Website",
    value: "www.nevoindustrial.com",
    external: true,
  },
] as const;

function ConnectCard() {
  return (
    <main className="min-h-screen bg-neutral-100 flex flex-col items-center">
      <div className="w-full max-w-md flex-1 bg-white shadow-[0_2px_40px_rgba(0,0,0,0.06)] flex flex-col">
        {/* Brand header */}
        <header className="bg-black px-8 pt-10 pb-8 text-center">
          <img
            src={nevoLogoLight}
            alt="NEVO Industrial"
            className="mx-auto h-10 w-auto"
            decoding="async"
          />
          <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          <p className="mt-5 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-white/60">
            Digital Business Card
          </p>
        </header>

        <div className="flex-1 px-7 pt-9 pb-10">
          {/* Person */}
          <div className="text-center">
            <h1 className="text-[1.6rem] sm:text-3xl font-bold tracking-tight text-black">
              Arsalan Manesh
            </h1>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              International Business Director
            </p>
          </div>

          {/* Company */}
          <div className="mt-7 rounded-lg bg-neutral-50 px-5 py-4 text-center">
            <p className="text-[0.8rem] font-bold leading-snug text-black">
              NEVO TRADING AND CONSULTANCY L.L.C – FZ
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Strategic Trading &amp; Consultancy Solutions
            </p>
          </div>

          {/* Contact options */}
          <nav aria-label="Contact options" className="mt-8 space-y-3">
            {CONTACTS.map((c) => (
              <a
                key={c.key}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-4 min-h-[74px] transition-all hover:border-accent hover:shadow-[0_4px_18px_rgba(0,0,0,0.07)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="shrink-0 grid h-12 w-12 place-items-center rounded-lg bg-black text-accent transition-colors group-hover:bg-accent group-hover:text-black">
                  {c.key === "whatsapp" && <WhatsAppIcon className="h-6 w-6" />}
                  {c.key === "email" && <Mail className="h-[22px] w-[22px]" strokeWidth={1.8} />}
                  {c.key === "website" && <Globe className="h-[22px] w-[22px]" strokeWidth={1.8} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold text-black">
                    {c.value}
                  </span>
                </span>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </a>
            ))}
          </nav>

          {/* QR code */}
          <section aria-labelledby="qr-heading" className="mt-8 border-t border-border pt-8">
            <h2
              id="qr-heading"
              className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            >
              Scan to connect
            </h2>

            <div className="mx-auto mt-5 w-fit max-w-full rounded-2xl border border-border bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG
                  value={CONNECT_URL}
                  size={168}
                  level="M"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="h-[168px] w-[168px] max-w-full"
                  title="QR code linking to nevoindustrial.com/connect"
                />
              </div>
            </div>

            <div className="mx-auto mt-4 grid max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2.5">
              <span className="min-w-0 truncate text-xs font-medium text-black" dir="ltr">
                {CONNECT_URL.replace("https://", "")}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-accent hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {copied ? "Link copied to clipboard" : ""}
            </p>
          </section>

          {/* Location */}
          <div className="mt-8 border-t border-border pt-6">
            <p className="flex items-center justify-center gap-2 text-sm text-black">
              <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              Meydan Freezone, Dubai, UAE
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="bg-black">
          <div className="h-1 w-full bg-accent" />
          <p className="px-6 py-6 text-center text-xs leading-relaxed text-white/60">
            © 2025 NEVO INDUSTRIAL. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}

