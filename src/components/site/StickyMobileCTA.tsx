import { useTranslation } from "react-i18next";
import { Link } from "@/components/site/LocalizedLink";
import { MessageCircle, ClipboardList } from "lucide-react";
import { SITE, WHATSAPP_URL } from "@/lib/seo";

export function StickyMobileCTA() {
  const { t } = useTranslation();
  const wa = SITE.contact.whatsapp ? WHATSAPP_URL : "/project-inquiry";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex gap-2 border-t border-border/60 bg-background/95 p-2 backdrop-blur md:hidden">
      <a
        href={wa}
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-3 text-sm font-medium text-foreground"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {SITE.contact.whatsapp ? t("home.sticky.whatsapp") : t("home.sticky.inquiry")}
      </a>
      <Link
        to="/project-inquiry"
        className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground"
      >
        <ClipboardList className="h-4 w-4" aria-hidden />
        {t("home.sticky.getQuote")}
      </Link>
    </div>
  );
}
