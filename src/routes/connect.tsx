import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Copy, ExternalLink, Globe, Loader2, Mail, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
    a11y: "Chat with Arsalan Manesh on WhatsApp at +971 50 242 6167",
    external: true,
  },
  {
    key: "email",
    href: "mailto:arsalan@nevoindustrial.com",
    label: "Email",
    value: "arsalan@nevoindustrial.com",
    a11y: "Send an email to arsalan@nevoindustrial.com",
    external: false,
  },
  {
    key: "website",
    href: "https://www.nevoindustrial.com/en",
    label: "Website",
    value: "www.nevoindustrial.com",
    a11y: "Visit the NEVO Industrial website at www.nevoindustrial.com",
    external: true,
  },
] as const;

const CONNECT_URL = "https://www.nevoindustrial.com/connect";

const ACTION_FEEDBACK: Record<string, string> = {
  whatsapp: "Opening WhatsApp…",
  email: "Opening your email app…",
  website: "Opening website…",
};

function ConnectCard() {
  const [copied, setCopied] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const lockRef = useRef(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const handleContactClick = useCallback(
    (key: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Ignore a rapid second click while the first action is still opening.
      if (lockRef.current) {
        e.preventDefault();
        return;
      }
      lockRef.current = true;
      setActiveKey(key);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => {
        lockRef.current = false;
        setActiveKey(null);
      }, 1600);
    },
    [],
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONNECT_URL);
      setCopied(true);
      toast.success("Link copied", { description: CONNECT_URL.replace("https://", "") });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      toast.error("Couldn't copy the link", { description: "Select the address and copy it manually." });
    }
  }, []);

  return (
    <main
      className="min-h-dvh bg-neutral-100 flex flex-col items-center [--accent:oklch(0.45_0.13_158)] [--border:oklch(0.88_0.004_260)] [--muted-foreground:oklch(0.43_0.012_260)] [--ring:oklch(0.45_0.13_158)]"
    >
      <div className="w-full max-w-md flex-1 bg-white shadow-[0_2px_40px_rgba(0,0,0,0.06)] flex flex-col">
        {/* Brand header */}
        <header className="bg-black px-5 pt-9 pb-7 text-center sm:px-8 sm:pt-10 sm:pb-8">
          <img
            src={nevoLogoLight}
            alt="NEVO Industrial"
            className="mx-auto h-14 w-auto max-w-[88%] object-contain [filter:contrast(1.12)_saturate(1.08)_drop-shadow(0_1px_2px_rgba(0,0,0,0.35))] sm:h-[4.5rem]"
            decoding="async"
          />
          <div className="mx-auto mt-6 h-px w-16 bg-[oklch(0.72_0.155_158)]" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-white/85">
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
            <p className="text-sm font-bold leading-snug text-black">
              NEVO TRADING AND CONSULTANCY L.L.C – FZ
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
              Strategic Trading &amp; Consultancy Solutions
            </p>

          </div>

          {/* Contact options */}
          <nav aria-labelledby="contact-heading" className="mt-8">
            <h2 id="contact-heading" className="sr-only">
              Contact Arsalan Manesh
            </h2>
            <ul className="space-y-3.5">
              {CONTACTS.map((c) => {
                const busy = activeKey === c.key;
                const dimmed = activeKey !== null && !busy;
                return (
                <li key={c.key}>
                  <a
                    href={c.href}
                    onClick={handleContactClick(c.key)}
                    data-busy={busy ? "true" : undefined}
                    aria-disabled={dimmed || undefined}
                    aria-label={`${c.a11y}${c.external ? " (opens in a new tab)" : ""}`}
                    {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`group relative flex items-center gap-2.5 min-[360px]:gap-3 min-[400px]:gap-4 overflow-hidden rounded-xl border bg-white px-2.5 min-[360px]:px-3 min-[400px]:px-4 py-4 min-h-[78px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-[transform,box-shadow,border-color,opacity] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.985] active:shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:duration-75 focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                      busy
                        ? "border-accent shadow-[0_10px_24px_-8px_rgba(0,0,0,0.18)]"
                        : "border-border"
                    } ${dimmed ? "opacity-55" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-0 left-0 w-[3px] origin-top bg-accent transition-transform duration-200 ease-out group-hover:scale-y-100 group-active:scale-y-100 group-focus-visible:scale-y-100 ${busy ? "scale-y-100" : "scale-y-0"}`}
                    />
                    <span
                      aria-hidden="true"
                      className={`shrink-0 grid h-11 w-11 min-[400px]:h-12 min-[400px]:w-12 place-items-center rounded-lg transition-colors duration-200 group-hover:bg-accent group-hover:text-white group-active:bg-accent group-active:text-white group-focus-visible:bg-accent group-focus-visible:text-white ${
                        busy ? "bg-accent text-white" : "bg-black text-[oklch(0.78_0.15_158)]"
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <>
                          {c.key === "whatsapp" && <WhatsAppIcon className="h-6 w-6" />}
                          {c.key === "email" && <Mail className="h-[22px] w-[22px]" strokeWidth={1.8} />}
                          {c.key === "website" && <Globe className="h-[22px] w-[22px]" strokeWidth={1.8} />}
                        </>
                      )}
                    </span>
                    <span className="min-w-0 flex-1" aria-hidden="true">
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-200 group-hover:text-black">
                        {c.label}
                      </span>
                      <span className="mt-1 block truncate text-xs min-[360px]:text-[0.82rem] font-semibold leading-tight tracking-tight text-black min-[400px]:text-[0.95rem] min-[400px]:tracking-normal" dir="ltr">
                        {busy ? ACTION_FEEDBACK[c.key] : c.value}
                      </span>
                    </span>
                    {busy ? (
                      <Check className="hidden min-[360px]:block h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                    ) : (
                      <ChevronRight
                        className="hidden min-[360px]:block h-5 w-5 shrink-0 text-muted-foreground transition-[transform,color] duration-200 group-hover:translate-x-1 group-hover:text-accent group-active:translate-x-0.5 group-focus-visible:translate-x-1 group-focus-visible:text-accent"
                        aria-hidden="true"
                      />
                    )}
                  </a>
                </li>
                );
              })}
            </ul>
            <p aria-live="polite" role="status" className="sr-only">
              {activeKey ? ACTION_FEEDBACK[activeKey] : ""}
            </p>
          </nav>



          {/* QR code */}
          <section aria-labelledby="qr-heading" className="mt-8 border-t border-border pt-8">
            <h2
              id="qr-heading"
              className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground"
            >
              Scan to connect
            </h2>

            <a
              href={CONNECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open www.nevoindustrial.com/connect (opens in a new tab)"
              className="group mx-auto mt-5 block w-fit max-w-full rounded-2xl border border-border bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.08)] outline-none transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.2)] active:translate-y-0 active:scale-[0.99] focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG
                  value={CONNECT_URL}
                  size={168}
                  level="M"
                  marginSize={0}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="h-[168px] w-[168px] max-w-full"
                  role="img"
                  aria-label="QR code linking to www.nevoindustrial.com/connect"
                  title="QR code linking to nevoindustrial.com/connect"
                />
              </div>
              <span
                aria-hidden="true"
                className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-200 group-hover:text-accent group-focus-visible:text-accent"
              >
                Tap to open
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </a>

            <div className="mx-auto mt-4 grid max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2">
              <input
                type="text"
                readOnly
                dir="ltr"
                value={CONNECT_URL.replace("https://", "")}
                aria-label="Digital business card link"
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                className="min-w-0 select-all truncate rounded-md bg-transparent px-1 py-2 text-sm font-medium text-black outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              />
              <button
                type="button"
                onClick={copyLink}
                aria-label="Copy link to this digital business card"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-black px-3.5 text-xs font-semibold uppercase tracking-wider text-white outline-none transition-colors hover:bg-accent hover:text-white focus-visible:bg-accent focus-visible:ring-[3px] focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p aria-live="polite" role="status" className="sr-only">
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
          <div className="h-1 w-full bg-[oklch(0.72_0.155_158)]" />
          <p className="px-6 py-6 text-center text-xs leading-relaxed text-white/85">
            © 2025 NEVO INDUSTRIAL. All rights reserved.
          </p>
        </footer>

      </div>
    </main>
  );
}

