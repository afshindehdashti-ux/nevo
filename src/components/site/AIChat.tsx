import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const DEFAULT_SUGGESTIONS = [
  "How much investment is needed for a sandwich panel factory?",
  "Which production line should I choose?",
  "PIR or Rock Wool — which is better for my project?",
  "How much land do I need for a 10,000 m² factory?",
  "How do I calculate production capacity?",
  "What panel thickness is recommended for cold storage at −25 °C?",
];

const WELCOME: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text:
        "Welcome. I'm your **NEVO AI Engineer** — a senior process engineer for the sandwich panel industry.\n\nI can help you with:\n- Factory Development & Layout\n- Production Line Selection (PIR / PUR / Rock Wool)\n- Raw Materials & Panel Specification\n- Capacity Planning & Automation\n- Investment Estimation & Factory Expansion\n- Engineering Consultancy & Technical Documentation\n\nAsk me anything, or pick one of the questions below.",
    },
  ],
};

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function AIChat({
  className,
  suggestions = DEFAULT_SUGGESTIONS,
  compact = false,
}: {
  className?: string;
  suggestions?: string[];
  compact?: boolean;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error } = useChat({
    id: "nevo-ai-engineer",
    messages: [WELCOME],
    transport,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy]);

  async function submit(text: string) {
    const value = text.trim();
    if (!value || isBusy) return;
    setInput("");
    await sendMessage({ text: value });
  }

  return (
    <div className={cn("flex h-full flex-col bg-[#0B0F14] text-white", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-accent)]/15 ring-1 ring-[color:var(--color-accent)]/40">
          <Sparkles className="h-4 w-4 text-[color:var(--color-accent)]" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[color:var(--color-accent)] ring-2 ring-[#0B0F14]" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight">NEVO AI Engineer</div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/50">
            Senior Process Engineer · Online
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className={cn("mx-auto flex flex-col gap-5", compact ? "max-w-none" : "max-w-3xl")}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error.message.includes("429")
                ? "Rate limit reached. Please try again in a moment."
                : error.message.includes("402")
                  ? "AI credits exhausted. Please add credits in your Lovable workspace."
                  : "The assistant is temporarily unavailable. Please retry."}
            </div>
          )}

          {messages.length <= 1 && (
            <div className="mt-2">
              <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/40">
                Suggested questions
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {suggestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => submit(q)}
                    className="group rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-[13px] leading-snug text-white/80 transition hover:border-[color:var(--color-accent)]/50 hover:bg-[color:var(--color-accent)]/5 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
        className="border-t border-white/10 bg-[#0B0F14]/95 px-4 pb-4 pt-3 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 focus-within:border-[color:var(--color-accent)]/50">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(input);
              }
            }}
            placeholder="Ask an engineering question…"
            rows={1}
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            aria-label="Send"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-accent)] text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl text-center text-[10px] uppercase tracking-[0.16em] text-white/30">
          NEVO AI Engineer · Engineering guidance, not a binding technical proposal.
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = textOf(message);
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed",
          isUser
            ? "bg-[color:var(--color-accent)] text-black"
            : "border border-white/10 bg-white/[0.03] text-white/90",
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{text}</div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-white prose-a:text-[color:var(--color-accent)]">
            <ReactMarkdown>{text || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
