import { Link } from "@tanstack/react-router";
import { MessageCircle, ClipboardList } from "lucide-react";
import { SITE } from "@/lib/seo";

/**
 * Sticky mobile CTA bar — WhatsApp + Project Inquiry.
 * Hidden on desktop (md+) where the header CTA is visible.
 */
export function StickyMobileCTA() {
  const wa = `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(
    "Hello NEVO Engineering — I'd like to discuss a project.",
  )}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex gap-2 border-t border-border/60 bg-background/95 p-2 backdrop-blur md:hidden">
      <a
        href={wa}
        target="_blank"
        rel="noopener"
        aria-label="Chat with NEVO on WhatsApp"
        className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-sm font-medium text-foreground"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        WhatsApp
      </a>
      <Link
        to="/project-inquiry"
        aria-label="Start a project inquiry"
        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground"
      >
        <ClipboardList className="h-4 w-4" aria-hidden />
        Get a Quote
      </Link>
    </div>
  );
}
