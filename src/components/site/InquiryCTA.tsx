import { ArrowRight } from "lucide-react";
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
 * Central inquiry hand-off. All solutions pages funnel to /project-inquiry
 * — the single, canonical intake form — instead of embedding per-page
 * duplicates.
 */
export function InquiryCTA({
  eyebrow = "Project inquiry",
  title = "Ready to brief the NEVO engineering team?",
  lede = "One central intake handles every solution — factory development, engineering consultancy, production lines, raw materials and panels. Share your scope once; the right specialist responds within one business day.",
  ctaLabel = "Open Project Inquiry",
}: Props) {
  return (
    <Section id="inquiry" tone="surface">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <SectionHeader eyebrow={eyebrow} title={title} lede={lede} />
        </div>
        <div className="lg:col-span-4 lg:justify-self-end">
          <Button asChild size="lg">
            <LocalizedLink to="/project-inquiry">
              {ctaLabel} <ArrowRight className="ml-2 !size-4" />
            </LocalizedLink>
          </Button>
        </div>
      </div>
    </Section>
  );
}
