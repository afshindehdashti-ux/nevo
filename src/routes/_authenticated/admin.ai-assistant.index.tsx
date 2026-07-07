import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  askAssistant,
  createChatSession,
  deleteChatSession,
  getChatSessionMessages,
  listChatSessions,
} from "@/lib/ai-assistant.functions";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/ai-assistant/")({
  head: () => ({
    meta: [
      { title: "NEVO AI Assistant — Internal" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AiAssistantPage,
});

const QUICK_QUESTIONS = [
  "How do I create a new customer?",
  "How do I generate a proforma invoice?",
  "How do I create a commission invoice for a supplier?",
  "What is the difference between proforma and commercial invoice?",
  "How do I update order shipment status?",
  "Which documents are required before marking an order as shipped?",
  "How do I export an invoice as PDF?",
  "What payments are still outstanding?",
];

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    document_title: string;
    document_id?: string;
    page_number: number | null;
    snippet?: string;
  }>;
};

function AiAssistantPage() {
  const qc = useQueryClient();
  const list = useServerFn(listChatSessions);
  const create = useServerFn(createChatSession);
  const remove = useServerFn(deleteChatSession);
  const load = useServerFn(getChatSessionMessages);
  const ask = useServerFn(askAssistant);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [localMessages, setLocalMessages] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sessions = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: () => list(),
  });

  const messages = useQuery({
    queryKey: ["ai-session-messages", activeId],
    queryFn: () => (activeId ? load({ data: { session_id: activeId } }) : Promise.resolve([])),
    enabled: !!activeId,
  });

  useEffect(() => {
    setLocalMessages(
      (messages.data ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        sources: Array.isArray(m.sources) ? (m.sources as Msg["sources"]) : [],
      })),
    );
  }, [messages.data, activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [localMessages, busy]);

  const activeSession = useMemo(
    () => sessions.data?.find((s) => s.id === activeId) ?? null,
    [sessions.data, activeId],
  );

  const lastSources = useMemo(() => {
    for (let i = localMessages.length - 1; i >= 0; i--) {
      const m = localMessages[i];
      if (m.role === "assistant" && m.sources && m.sources.length > 0) return m.sources;
    }
    return [];
  }, [localMessages]);

  const createMut = useMutation({
    mutationFn: async () => create({ data: { title: "New conversation" } }),
    onSuccess: (s) => {
      setActiveId(s.id);
      setLocalMessages([]);
      qc.invalidateQueries({ queryKey: ["ai-sessions"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => remove({ data: { id } }),
    onSuccess: (_r, id) => {
      if (activeId === id) {
        setActiveId(null);
        setLocalMessages([]);
      }
      qc.invalidateQueries({ queryKey: ["ai-sessions"] });
    },
  });

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setInput("");
    let sid = activeId;
    try {
      if (!sid) {
        const s = await create({ data: { title: value.slice(0, 60) } });
        sid = s.id;
        setActiveId(sid);
        qc.invalidateQueries({ queryKey: ["ai-sessions"] });
      }
      setLocalMessages((m) => [...m, { role: "user", content: value }]);
      const res = await ask({ data: { session_id: sid, message: value } });
      setLocalMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources.map((s) => ({
            document_title: s.document_title,
            document_id: s.document_id,
            page_number: s.page_number,
            snippet: s.snippet,
          })),
        },
      ]);
      qc.invalidateQueries({ queryKey: ["ai-sessions"] });
      qc.invalidateQueries({ queryKey: ["ai-session-messages", sid] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[280px_1fr_320px] gap-0 bg-white">
      {/* LEFT: sessions + KB shortcut */}
      <aside className="flex flex-col border-r border-neutral-200 bg-neutral-950 text-white">
        <div className="border-b border-neutral-800 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">NEVO AI Assistant</h2>
          </div>
          <Button
            size="sm"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New chat
          </Button>
        </div>

        <nav className="border-b border-neutral-800 p-3">
          <Link
            to="/admin/ai-assistant/knowledge-base"
            className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base
            <ChevronRight className="ml-auto h-3.5 w-3.5" />
          </Link>
        </nav>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
            Recent conversations
          </p>
          {sessions.isLoading ? (
            <p className="px-2 text-xs text-neutral-500">Loading…</p>
          ) : (sessions.data ?? []).length === 0 ? (
            <p className="px-2 text-xs text-neutral-500">No conversations yet.</p>
          ) : (
            <ul className="space-y-1">
              {(sessions.data ?? []).map((s) => (
                <li key={s.id}>
                  <div
                    className={`group flex items-center gap-1 rounded px-2 py-1.5 text-xs ${
                      activeId === s.id
                        ? "bg-emerald-600/20 text-emerald-100"
                        : "text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex-1 truncate text-left"
                      onClick={() => setActiveId(s.id)}
                      title={s.title}
                    >
                      <MessageSquare className="mr-1.5 inline h-3 w-3 opacity-70" />
                      {s.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMut.mutate(s.id)}
                      className="opacity-0 transition group-hover:opacity-100"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* CENTER: chat */}
      <main className="flex min-w-0 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 px-6 py-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">
              {activeSession?.title ?? "Ask the assistant"}
            </h1>
            <p className="text-[11px] text-neutral-500">
              Internal use only. Answers may be based on uploaded NEVO documents.
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700">
              GPT-5 mini · RAG
            </Badge>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-neutral-50 px-6 py-6">
          {localMessages.length === 0 && !busy ? (
            <div className="mx-auto max-w-2xl">
              <Card className="border-emerald-200/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-emerald-600" /> Try a quick question
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      type="button"
                      key={q}
                      onClick={() => void send(q)}
                      className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700"
                    >
                      {q}
                    </button>
                  ))}
                </CardContent>
              </Card>
              <p className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Do not upload confidential third-party documents without authorisation. The
                assistant never modifies data automatically — every financial or status-changing
                action must be confirmed by you.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {localMessages.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[80%] rounded-xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-sm"
                      : "max-w-[92%] rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm"
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.role === "assistant" && m.sources && m.sources.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                      {m.sources.map((s, j) => (
                        <span
                          key={j}
                          className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800"
                          title={s.snippet ?? ""}
                        >
                          [{j + 1}] {s.document_title}
                          {s.page_number ? ` · p.${s.page_number}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {busy ? (
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              ) : null}
            </div>
          )}
        </div>

        <footer className="border-t border-neutral-200 bg-white p-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask about CRM, invoices, customers, orders, uploaded documents…"
              rows={2}
              disabled={busy}
              className="min-h-[60px] resize-none"
            />
            <Button
              type="button"
              onClick={() => void send(input)}
              disabled={busy || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="mr-1.5 h-4 w-4" /> Send
                </>
              )}
            </Button>
          </div>
        </footer>
      </main>

      {/* RIGHT: sources panel */}
      <aside className="flex flex-col border-l border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">Sources</h3>
          <p className="text-[11px] text-neutral-500">Citations from the latest answer.</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {lastSources.length === 0 ? (
            <p className="text-xs text-neutral-500">
              No document sources cited yet. Upload documents to the Knowledge Base to enable
              retrieval-augmented answers.
            </p>
          ) : (
            <ol className="space-y-3 text-xs">
              {lastSources.map((s, i) => (
                <li
                  key={i}
                  className="rounded border border-neutral-200 bg-neutral-50 p-2"
                >
                  <div className="mb-1 flex items-center gap-1 text-[10px] text-emerald-700">
                    <span className="font-semibold">[{i + 1}]</span>
                    <span className="truncate font-medium text-neutral-900">
                      {s.document_title}
                    </span>
                    {s.page_number ? (
                      <span className="text-neutral-500">· p.{s.page_number}</span>
                    ) : null}
                  </div>
                  {s.snippet ? (
                    <p className="text-[11px] leading-snug text-neutral-600">{s.snippet}…</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
