import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Globe, Mail, MapPin } from "lucide-react";
import nevoLogoDark from "@/assets/nevo-logo-dark.png";


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
    <main className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 w-full max-w-md mx-auto px-6 pt-12 pb-10 flex flex-col">
        {/* Logo */}
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black leading-none">
            NE<span className="text-accent">V</span>O
          </div>
          <div className="mt-2 text-[0.7rem] sm:text-xs font-semibold text-accent tracking-[0.42em] pl-[0.42em]">
            INDUSTRIAL
          </div>
          <div className="mx-auto mt-6 h-px w-24 bg-accent" />
        </div>

        {/* Person */}
        <div className="mt-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
            Arsalan Manesh
          </h1>
          <p className="mt-1.5 text-sm sm:text-base font-medium text-accent">
            International Business Director
          </p>
        </div>

        {/* Company */}
        <div className="mt-6 text-center">
          <p className="text-sm font-bold text-black leading-snug">
            NEVO TRADING AND CONSULTANCY L.L.C – FZ
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Strategic Trading &amp; Consultancy Solutions
          </p>
        </div>

        {/* Contact options */}
        <nav aria-label="Contact options" className="mt-9 space-y-3">
          {CONTACTS.map((c) => (
            <a
              key={c.key}
              href={c.href}
              {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-center gap-4 rounded-xl border border-border bg-white px-4 py-4 min-h-[72px] transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="shrink-0 grid h-12 w-12 place-items-center rounded-lg bg-black text-accent">
                {c.key === "whatsapp" && <WhatsAppIcon className="h-7 w-7" />}
                {c.key === "email" && <Mail className="h-6 w-6" strokeWidth={1.8} />}
                {c.key === "website" && <Globe className="h-6 w-6" strokeWidth={1.8} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-black">{c.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.value}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </a>
          ))}
        </nav>

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
        <p className="px-6 py-6 text-center text-xs leading-relaxed text-white/70">
          © 2025 NEVO INDUSTRIAL.
          <br />
          All rights reserved.
        </p>
      </footer>
    </main>
  );
}
