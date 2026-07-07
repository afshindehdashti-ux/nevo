import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Send, Loader2, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  askAssistant,
  createChatSession,
  getRecordSummary,
} from "@/lib/ai-assistant.functions";

type Msg = {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ document_title: string; page_number: number | null }>;
};

/** Derive { module, record_id } from a CRM route like /admin/customers/<uuid>. */
function deriveContext(pathname: string): {
  module?: "customer" | "supplier" | "order" | "invoice" | "quotation" | "lead";
  record_id?: string;
  route: string;
} {
  const uuid = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const rec = pathname.match(uuid)?.[1];
  const map: Record<string, "customer" | "supplier" | "order" | "invoice" | "quotation" | "lead"> =
    {
      customers: "customer",
      suppliers: "supplier",
      orders: "order",
      invoices: "invoice",
      "proforma-invoices": "invoice",
      "commission-invoices": "invoice",
      quotations: "quotation",
      leads: "lead",
    };
  for (const [seg, mod] of Object.entries(map)) {
    if (pathname.includes(`/${seg}/`) || pathname.endsWith(`/${seg}`)) {
      return { module: mod, record_id: rec, route: pathname };
    }
  }
  return { route: pathname };
}

export function AiAssistDrawer() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ctx = useMemo(() => deriveContext(location.pathname), [location.pathname]);

  const create = useServerFn(createChatSession);
  const ask = useServerFn(askAssistant);
  const summarise = useServerFn(getRecordSummary);

  // Refresh record summary when opening or context changes.
  useEffect(() => {
    if (!open) return;
    setSummary(null);
    if (ctx.module && ctx.record_id) {
      summarise({ data: { module: ctx.module, id: ctx.record_id } })
        .then((r) => setSummary(r.summary ?? null))
        .catch(() => setSummary(null));
    }
  }, [open, ctx.module, ctx.record_id, summarise]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const s = await create({
      data: {
        title: ctx.module ? `Assist: ${ctx.module}` : "Quick assist",
        related_module: ctx.module,
        related_record_id: ctx.record_id,
      },
    });
    setSessionId(s.id);
    return s.id;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const sid = await ensureSession();
      const res = await ask({
        data: {
          session_id: sid,
          message: text,
          context: {
            module: ctx.module,
            route: ctx.route,
            record_id: ctx.record_id,
            record_summary: summary ?? undefined,
          },
        },
      });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.answer,
          sources: res.sources.map((s) => ({
            document_title: s.document_title,
            page_number: s.page_number,
          })),
        },
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI request failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry — the assistant is unavailable right now." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-4 w-4" />
        AI Assist
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border bg-neutral-950 px-4 py-3 text-white">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              NEVO AI Assist
            </SheetTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
              {ctx.module ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                  {ctx.module}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                  general
                </Badge>
              )}
              {ctx.record_id ? (
                <span className="font-mono text-[10px] opacity-70">
                  {ctx.record_id.slice(0, 8)}…
                </span>
              ) : null}
            </div>
            {summary ? (
              <p className="rounded bg-neutral-900 px-2 py-1 text-[11px] leading-snug text-neutral-300">
                {summary}
              </p>
            ) : null}
          </SheetHeader>

          <ScrollArea className="flex-1" viewportRef={scrollRef}>
            <div className="flex flex-col gap-3 px-4 py-4">
              {messages.length === 0 && !busy ? (
                <div className="rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
                  <p className="mb-2 font-medium text-neutral-800">Ask about this page</p>
                  <ul className="list-disc space-y-1 pl-4 text-xs">
                    <li>What does this status mean?</li>
                    <li>Which fields am I missing?</li>
                    <li>What is the next best action?</li>
                    <li>Summarise this record.</li>
                  </ul>
                </div>
              ) : null}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "self-end max-w-[85%] rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white"
                      : "self-start max-w-[95%] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm"
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  {m.role === "assistant" && m.sources && m.sources.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-neutral-600">
                      {m.sources.map((s, j) => (
                        <span
                          key={j}
                          className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800"
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
                <div className="self-start flex items-center gap-2 text-xs text-neutral-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                </div>
              ) : null}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-neutral-50 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Ask about this page, invoice, customer, or CRM…"
                rows={2}
                disabled={busy}
                className="min-h-[52px] resize-none bg-white"
              />
              <Button
                type="button"
                onClick={handleSend}
                disabled={busy || !input.trim()}
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" /> {messages.length} message
                {messages.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                className="flex items-center gap-1 hover:text-neutral-800"
                onClick={() => {
                  setMessages([]);
                  setSessionId(null);
                }}
              >
                <X className="h-3 w-3" /> Reset
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
