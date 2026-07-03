import { ArrowRight, Clock, FileText, Inbox } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalizedLink } from "@/components/site/LocalizedLink";
import { ARTICLES } from "@/lib/knowledge-articles";

type Props = {
  slugs: string[];
  eyebrow?: string;
  title?: string;
  lede?: string;
  loading?: boolean;
};

/**
 * Route-scoped Knowledge Hub preview. Each Solutions page picks 3 relevant
 * articles by slug; deep links open the full article on /knowledge-hub/{slug}
 * and the "See all" link leads to the master library. Single source of
 * truth — no duplicated article copy per route.
 */
export function KnowledgeHubPreview({
  slugs,
  eyebrow = "Knowledge hub",
  title = "Read the engineering behind this scope.",
  lede = "Handpicked technical articles and downloadable references from the NEVO engineering desk — matched to this solution.",
  loading = false,
}: Props) {
  const items = slugs
    .map((s) => ARTICLES.find((a) => a.slug === s))
    .filter((a): a is (typeof ARTICLES)[number] => Boolean(a));

  const hasMatches = items.length > 0;

  return (
    <Section tone="default">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <SectionHeader eyebrow={eyebrow} title={title} lede={lede} />
        </div>
        <Button asChild variant="ghost" size="lg" className="self-start lg:self-end">
          <LocalizedLink to="/knowledge-hub">
            Open Knowledge Hub <ArrowRight className="ml-2 !size-4" />
          </LocalizedLink>
        </Button>
      </div>

      {loading ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
            >
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="flex flex-1 flex-col p-6">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="mt-4 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-5/6" />
                <Skeleton className="mt-1 h-4 w-2/3" />
                <Skeleton className="mt-6 h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : hasMatches ? (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <LocalizedLink
              key={a.slug}
              to="/knowledge-hub/$slug"
              params={{ slug: a.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-border-strong hover:bg-surface"
            >
              <div className="aspect-[16/10] overflow-hidden bg-black">
                <img
                  src={a.cover}
                  alt={a.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-accent">
                  <span>{a.category}</span>
                  <span className="h-px w-4 bg-border-strong" />
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3" /> {a.readMin} min
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-medium tracking-tight text-foreground">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-accent">
                  Read article <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </LocalizedLink>
          ))}
        </div>
      ) : (
        <div className="mt-12 flex flex-col items-start gap-6 rounded-2xl border border-dashed border-border bg-surface/50 p-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Inbox className="size-5 text-accent" />
            </div>
            <div className="max-w-xl">
              <h3 className="text-base font-medium text-foreground">No matching articles yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We are curating the library for this solution. Explore the full Knowledge Hub or download technical references in the Download Center.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <LocalizedLink to="/knowledge-hub">
                Browse Knowledge Hub
              </LocalizedLink>
            </Button>
            <Button asChild variant="ghost">
              <LocalizedLink to="/download-center">
                Download Center
              </LocalizedLink>
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <FileText className="size-4 text-accent" strokeWidth={1.5} />
        Need the full PDF pack for this solution?{" "}
        <LocalizedLink
          to="/download-center"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Open the Download Center
        </LocalizedLink>
        .
      </div>
    </Section>
  );
}
