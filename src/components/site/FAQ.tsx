import { Section, SectionHeader } from "@/components/site/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What does NEVO actually do?",
    a: "NEVO is an industrial engineering and supply company for the sandwich panel industry. We help investors build factories, support existing manufacturers with engineering and modernization, supply raw materials and complete production lines, and deliver finished panels across selected regional markets.",
  },
  {
    q: "Do you sell panels worldwide?",
    a: "Engineering, consultancy, raw materials and production lines are delivered globally. Finished panel supply is focused on selected regional markets including Saudi Arabia, Oman, UAE, Turkey, Iraq, Kenya, Cameroon, Russia and other African countries.",
  },
  {
    q: "Can you help us set up a new sandwich panel factory?",
    a: "Yes. Factory development is one of our core solutions — from initial feasibility and process design to layout, procurement, installation supervision, commissioning and long-term support.",
  },
  {
    q: "Which raw materials do you supply?",
    a: "PIR and PUR chemical systems, PPGI, GI and Aluzinc coils, rock wool cores, adhesives, films and consumables — all qualified for panel manufacturing.",
  },
  {
    q: "How do we start a project with NEVO?",
    a: "Submit a project inquiry with your goal, market and timeline. A senior engineer will respond within one business day with a scoped technical proposal.",
  },
];

export function FAQ() {
  return (
    <Section tone="surface">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="FAQ"
            title="Straight answers, engineered honestly."
            lede="If your question isn't answered here, our engineering desk usually replies within one business day."
          />
        </div>
        <div className="lg:col-span-8">
          <Accordion
            type="single"
            collapsible
            className="w-full divide-y divide-border border-y border-border"
          >
            {FAQS.map((f, i) => (
              <AccordionItem
                key={f.q}
                value={`item-${i}`}
                className="border-b-0"
              >
                <AccordionTrigger className="py-5 text-left text-base font-medium tracking-tight text-foreground hover:no-underline">
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[11px] tracking-widest text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-9 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}
