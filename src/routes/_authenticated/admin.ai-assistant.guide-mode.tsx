import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  GraduationCap,
  Search as SearchIcon,
  Sparkles,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GUIDE_SECTIONS,
  GUIDE_CATEGORY_LABELS,
  type GuideCategory,
  type GuideSection,
} from "@/lib/guide-content";
import { GuideSectionBody } from "@/components/ai/GuideMeButton";

const CATEGORY_FILTERS: Array<{ id: "all" | GuideCategory; label: string }> = [
  { id: "all", label: "All Guides" },
  { id: "sales", label: GUIDE_CATEGORY_LABELS.sales },
  { id: "finance", label: GUIDE_CATEGORY_LABELS.finance },
  { id: "operations", label: GUIDE_CATEGORY_LABELS.operations },
  { id: "management", label: GUIDE_CATEGORY_LABELS.management },
  { id: "admin", label: GUIDE_CATEGORY_LABELS.admin },
];

const searchSchema = z.object({
  section: z.string().optional().default(""),
});

export const Route = createFileRoute("/_authenticated/admin/ai-assistant/guide-mode")({
  head: () => ({
    meta: [{ title: "Guide Mode — NEVO AI Assistant" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: zodValidator(searchSchema),
  component: GuideModePage,
});

function GuideModePage() {
  const navigate = useNavigate({ from: "/admin/ai-assistant/guide-mode" });
  const search = Route.useSearch();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | GuideCategory>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GUIDE_SECTIONS.filter((s) => {
      if (category !== "all" && s.category !== category) return false;
      if (!q) return true;
      const hay = [
        s.title,
        s.description,
        ...s.steps,
        ...(s.requiredFields ?? []),
        ...(s.commonMistakes ?? []),
        s.bestPractice ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, category]);

  const activeId = search.section || filtered[0]?.id || GUIDE_SECTIONS[0].id;
  const active: GuideSection = GUIDE_SECTIONS.find((s) => s.id === activeId) ?? GUIDE_SECTIONS[0];

  function selectSection(id: string) {
    void navigate({ search: { section: id } });
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[280px_1fr_320px] bg-white">
      {/* LEFT: sidebar */}
      <aside className="flex flex-col border-r border-neutral-200 bg-neutral-950 text-white">
        <div className="border-b border-neutral-800 p-4">
          <div className="mb-2 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Guide Mode</h2>
          </div>
          <p className="text-[11px] text-neutral-400">
            Learn how to use the NEVO CRM, step by step.
          </p>
        </div>

        <div className="border-b border-neutral-800 p-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-neutral-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search how to use the CRM…"
              className="h-8 border-neutral-800 bg-neutral-900 pl-7 text-xs text-white placeholder:text-neutral-500"
            />
          </div>
        </div>

        <div className="border-b border-neutral-800 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Filter
          </p>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategory(f.id)}
                className={`rounded-full px-2 py-0.5 text-[10px] transition ${
                  category === f.id
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-xs text-neutral-500">No guides match “{query}”.</p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectSection(s.id)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition ${
                      activeId === s.id
                        ? "bg-emerald-600/20 text-emerald-100"
                        : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <BookOpen className="h-3 w-3 opacity-70" />
                    <span className="flex-1 truncate">{s.title}</span>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>

      {/* CENTER: content */}
      <main className="flex min-w-0 flex-col overflow-y-auto">
        <header className="border-b border-neutral-200 px-8 py-5">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">
              {GUIDE_CATEGORY_LABELS[active.category]}
            </Badge>
            <span className="text-[11px] text-neutral-500">Guide {activeId}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
            {active.title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-neutral-600">{active.description}</p>
        </header>

        <div className="mx-auto w-full max-w-3xl px-8 py-6">
          <GuideSectionBody section={active} />
        </div>
      </main>

      {/* RIGHT: quick help */}
      <aside className="flex flex-col border-l border-neutral-200 bg-neutral-50">
        <div className="border-b border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">Quick help</h3>
          <p className="text-[11px] text-neutral-500">
            Ask the assistant or open the related CRM page.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          <Button asChild className="justify-start bg-emerald-600 hover:bg-emerald-700">
            <Link to="/admin/ai-assistant">
              <Sparkles className="mr-2 h-4 w-4" />
              Ask AI about “{active.title}”
            </Link>
          </Button>
          {active.relatedRoute ? (
            <Button asChild variant="outline" className="justify-start">
              <Link to={active.relatedRoute.to}>
                <ChevronRight className="mr-2 h-4 w-4" />
                {active.relatedRoute.label}
              </Link>
            </Button>
          ) : null}

          <div className="mt-4 rounded border border-neutral-200 bg-white p-3 text-[11px] leading-relaxed text-neutral-600">
            <p className="mb-1 font-semibold text-neutral-800">Guide Mode rules</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>The AI never approves, sends, deletes or marks paid automatically.</li>
              <li>Every financial action must be confirmed by you.</li>
              <li>If the guide is missing a step, ask the assistant — do not invent policy.</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
