import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, ChevronRight, Clock, User, Calendar, Sparkles, Download, Mail, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/seo";
import { ARTICLES, ARTICLES_BY_SLUG, type Article } from "@/lib/knowledge-articles";

export const Route = createFileRoute("/knowledge-hub/$slug")({
  component: ArticlePage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen bg-[#05070a] text-white grid place-items-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm text-white/60">{error.message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => { router.invalidate(); reset(); }} className="bg-emerald-500 text-black">Retry</Button>
            <Button asChild variant="outline"><Link to="/knowledge-hub">Back to Knowledge Hub</Link></Button>
          </div>
        </div>
      </div>
    );
  },
  notFoundComponent: () => {
    const { slug } = Route.useParams();
    return (
      <div className="min-h-screen bg-[#05070a] text-white grid place-items-center p-8">
        <div className="max-w-md text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">404</div>
          <h1 className="mt-2 text-2xl font-semibold">Article "{slug}" not found</h1>
          <p className="mt-3 text-sm text-white/60">The article may have moved or been archived.</p>
          <div className="mt-6"><Button asChild className="bg-emerald-500 text-black"><Link to="/knowledge-hub">Browse Knowledge Hub</Link></Button></div>
        </div>
      </div>
    );
  },
  loader: ({ params }) => {
    const article = ARTICLES_BY_SLUG[params.slug];
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "Article — NEVO Knowledge Hub" }] };
    const url = `${SITE.url}/knowledge-hub/${a.slug}`;
    return {
      meta: [
        { title: `${a.title} — NEVO Knowledge Hub` },
        { name: "description", content: a.excerpt },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: a.cover },
        { property: "article:author", content: a.author },
        { property: "article:published_time", content: a.date },
        { property: "article:section", content: a.section },
      ],
      links: [{ rel: "canonical", href: `${SITE.url}/knowledge-hub/${a.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            image: a.cover,
            author: { "@type": "Organization", name: a.author },
            publisher: { "@type": "Organization", name: "NEVO Industrial" },
            datePublished: a.date,
            mainEntityOfPage: url,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
              { "@type": "ListItem", position: 2, name: "Knowledge Hub", item: `${SITE.url}/knowledge-hub` },
              { "@type": "ListItem", position: 3, name: a.title, item: url },
            ],
          }),
        },
      ],
    };
  },
});

function ArticlePage() {
  const { article } = Route.useLoaderData() as { article: Article };
  const related = ARTICLES.filter((x) => x.slug !== article.slug && x.category === article.category).slice(0, 3);
  const fallback = ARTICLES.filter((x) => x.slug !== article.slug).slice(0, 3);
  const rel = related.length ? related : fallback;

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img src={article.cover} alt="" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/40 via-[#05070a]/70 to-[#05070a]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-14">
          <nav aria-label="Breadcrumb" className="text-[11px] font-mono uppercase tracking-widest text-white/40 mb-6 flex flex-wrap gap-2 items-center">
            <Link to="/" className="hover:text-emerald-400">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/knowledge-hub" className="hover:text-emerald-400">Knowledge Hub</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70 normal-case tracking-normal font-sans">{article.category}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 rounded px-2 py-1">{article.category}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 border border-white/15 rounded px-2 py-1">{article.section}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 border border-white/15 rounded px-2 py-1">{article.level}</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">{article.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70 leading-relaxed">{article.excerpt}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {article.author}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(article.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {article.readMin} min read</span>
          </div>
        </div>
      </header>

      {/* BODY */}
      <article className="mx-auto max-w-3xl px-6 py-16">
        {article.key_takeaways?.length > 0 && (
          <aside className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Key takeaways</div>
            <ul className="mt-4 space-y-2 text-sm text-white/80 leading-relaxed">
              {article.key_takeaways.map((k, i) => (
                <li key={i} className="flex gap-3"><span className="text-emerald-400 font-mono">{String(i + 1).padStart(2, "0")}</span><span>{k}</span></li>
              ))}
            </ul>
          </aside>
        )}

        <div className="mt-12 space-y-12">
          {article.body.map((sec, i) => (
            <section key={i}>
              <h2 className="text-2xl font-semibold tracking-tight text-white">{sec.h}</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-[1.75] text-white/70">
                {sec.p.map((para, j) => <p key={j}>{para}</p>)}
              </div>
            </section>
          ))}
        </div>

        {/* Inline CTA */}
        <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Have a project on this topic?</div>
            <div className="text-xs text-white/50 mt-1">A NEVO senior engineer will respond within one working day.</div>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"><Link to="/project-inquiry">Talk to an Engineer</Link></Button>
            <Button asChild variant="outline" className="border-white/15"><Link to="/download-center"><Download className="h-4 w-4 mr-2" /> Guides</Link></Button>
          </div>
        </div>
      </article>

      {/* RELATED */}
      <section className="border-t border-white/5 py-16 bg-gradient-to-b from-transparent to-emerald-500/[0.03]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Continue reading</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Related articles</h2>
            </div>
            <Link to="/knowledge-hub" className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-emerald-400">
              <ArrowLeft className="h-3.5 w-3.5" /> All articles
            </Link>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {rel.map((r) => (
              <Link key={r.slug} to="/knowledge-hub/$slug" params={{ slug: r.slug }} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 transition">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={r.cover} alt="" loading="lazy" className="h-full w-full object-cover opacity-90 group-hover:scale-[1.03] transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-widest text-emerald-300 border border-emerald-500/40 bg-black/50 rounded px-1.5 py-0.5">{r.category}</span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold tracking-tight group-hover:text-emerald-300 transition leading-snug">{r.title}</h3>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {r.readMin} min</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">Read <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <BookOpen className="h-8 w-8 text-emerald-400 mx-auto" />
          <h2 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight">Explore the full library</h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">500+ technical articles, 24 academy courses and 120+ downloads — written by NEVO engineers.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-12 px-6"><Link to="/knowledge-hub">Back to Knowledge Hub</Link></Button>
            <Button asChild variant="outline" className="border-white/15 bg-white/[0.03] h-12 px-6"><Link to="/ai-assistant"><Sparkles className="h-4 w-4 mr-2" /> Ask the AI Engineer</Link></Button>
            <Button asChild variant="ghost" className="text-white/70 hover:text-white h-12 px-6"><a href="mailto:engineers@nevo-industrial.com"><Mail className="h-4 w-4 mr-2" /> Email us</a></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
