import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getGuideSection, type GuideSection } from "@/lib/guide-content";

type Props = {
  /** Guide section id — see src/lib/guide-content.ts */
  sectionId: string;
  /** Optional label override (defaults to "Guide Me: <title>"). */
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

/**
 * Contextual "Guide Me" button for CRM pages.
 *
 * Opens a right-hand drawer with the step-by-step guide for the given section,
 * plus deep links into the full Guide Mode and the section's AI Assistant question.
 */
export function GuideMeButton({
  sectionId,
  label,
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const section = getGuideSection(sectionId);
  if (!section) return null;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <GraduationCap className="mr-1.5 h-4 w-4 text-emerald-600" />
        {label ?? `Guide Me: ${section.title}`}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-emerald-700">
              <GraduationCap className="h-5 w-5" />
              {section.title}
            </SheetTitle>
            <SheetDescription>{section.description}</SheetDescription>
          </SheetHeader>

          <GuideSectionBody section={section} />

          <div className="mt-6 flex flex-col gap-2 border-t border-neutral-200 pt-4">
            <Button asChild variant="secondary" className="justify-start">
              <Link
                to="/admin/ai-assistant/guide-mode"
                search={{ section: section.id }}
                onClick={() => setOpen(false)}
              >
                <GraduationCap className="mr-2 h-4 w-4" />
                Open full Guide Mode
              </Link>
            </Button>
            <Button asChild className="justify-start bg-emerald-600 hover:bg-emerald-700">
              <Link to="/admin/ai-assistant" onClick={() => setOpen(false)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Ask AI about “{section.title}”
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function GuideSectionBody({ section }: { section: GuideSection }) {
  return (
    <div className="mt-4 space-y-5 text-sm text-neutral-800">
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Step-by-step
        </h4>
        <ol className="list-decimal space-y-1.5 pl-5">
          {section.steps.map((step, i) => (
            <li key={i} className="leading-relaxed">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {section.requiredFields && section.requiredFields.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Required fields
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {section.requiredFields.map((f) => (
              <span
                key={f}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800"
              >
                {f}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {section.commonMistakes && section.commonMistakes.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-600">
            Common mistakes
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-neutral-700">
            {section.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {section.bestPractice ? (
        <section className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="mb-1 font-semibold uppercase tracking-wider">Best practice</div>
          {section.bestPractice}
        </section>
      ) : null}

      {section.relatedRoute ? (
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={section.relatedRoute.to}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            {section.relatedRoute.label}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
