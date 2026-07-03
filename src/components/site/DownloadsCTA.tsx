import { ArrowRight, FileText } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { LocalizedLink } from "@/components/site/LocalizedLink";

type Props = {
  eyebrow?: string;
  title?: string;
  lede?: string;
  ctaLabel?: string;
};

/**
 * Central downloads hand-off. Every solutions page links to /download-center
 * — the single, canonical library of technical documents — instead of
 * re-listing partial catalogues.
 */
export function DownloadsCTA({
  eyebrow = "Downloads",
  title = "Every technical document, in one place.",
  lede = "Catalogues, selection guides, engineering checklists and datasheets — the full NEVO document library lives in the Download Center. Request individual files or the complete pack in one step.",
  ctaLabel = "Open Download Center",
}: Props) {
  return (
    <Section id="downloads" tone="default">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-8">
          <SectionHeader eyebrow={eyebrow} title={title} lede={lede} />
        </div>
        <div className="flex items-center gap-4 lg:col-span-4 lg:justify-self-end">
          <div className="hidden size-12 items-center justify-center rounded-lg bg-accent/10 text-accent lg:flex">
            <FileText className="size-6" strokeWidth={1.5} />
          </div>
          <Button asChild size="lg">
            <LocalizedLink to="/download-center">
              {ctaLabel} <ArrowRight className="ml-2 !size-4" />
            </LocalizedLink>
          </Button>
        </div>
      </div>
    </Section>
  );
}
