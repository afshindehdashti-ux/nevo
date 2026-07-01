import {
  Compass,
  MapPin,
  Globe2,
  BookOpenCheck,
  Layers3,
  HandshakeIcon,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";

const PROOFS = [
  {
    icon: Compass,
    title: "Engineering Expertise",
    desc: "Senior engineers lead every scope — from PIR chemistry to line automation and coil metallurgy.",
  },
  {
    icon: MapPin,
    title: "Dubai-Based Project Management",
    desc: "A strategic base for the Middle East, Africa, Eurasia and Asia — with responsive local coordination.",
  },
  {
    icon: Globe2,
    title: "Global Supply Network",
    desc: "Qualified partners across Europe, Turkey, Asia and the GCC for materials, equipment and logistics.",
  },
  {
    icon: BookOpenCheck,
    title: "Technical Consultancy",
    desc: "Independent advice on feasibility, process design, production optimization and modernization.",
  },
  {
    icon: Layers3,
    title: "Integrated Industrial Solutions",
    desc: "Factory setup, raw materials, production lines and finished panels — one accountable partner.",
  },
  {
    icon: HandshakeIcon,
    title: "Long-Term Partnership",
    desc: "Audits, training, spare parts and troubleshooting — for factories that operate for decades.",
  },
];

export function WhyNevo() {
  return (
    <Section tone="primary" bordered={false}>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeader
            eyebrow="Why NEVO"
            onTone="primary"
            title="Engineering-Led. Globally Connected."
            lede="NEVO exists because the sandwich panel industry deserves a partner that speaks its technical language — end to end."
          />
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:col-span-7">
          {PROOFS.map((p, i) => (
            <div
              key={p.title}
              className="group relative bg-primary p-6 transition-colors hover:bg-white/[0.04] sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <p.icon
                  className="size-5 text-accent"
                  strokeWidth={1.5}
                />
                <span className="font-mono text-[10px] tracking-widest text-white/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-h3 text-primary-foreground">{p.title}</h3>
              <p className="text-body mt-3 text-primary-foreground/65">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
