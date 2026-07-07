/**
 * Server-only helpers for the NEVO AI Assistant.
 * Chunking, embedding, retrieval, and Lovable AI Gateway chat calls.
 * Never import from client-reachable modules directly.
 */

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1";
const EMBEDDING_MODEL = "openai/text-embedding-3-small"; // 1536 dims
const CHAT_MODEL = "openai/gpt-5-mini";

export const AI_CHUNK_SIZE = 1000;
export const AI_CHUNK_OVERLAP = 150;
export const AI_EMBED_BATCH = 64;

export type EmbedInput = { text: string; index: number };

function requireKey(): string {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

function normaliseAiError(status: number, body?: string): Error {
  if (status === 429) return new Error("AI is rate-limited. Try again in a few seconds.");
  if (status === 402) return new Error("AI credits exhausted. Please add credits to continue.");
  return new Error(`AI request failed (${status})${body ? `: ${body.slice(0, 200)}` : ""}`);
}

/** Split plain text into ~1000-char chunks with overlap. */
export function chunkText(text: string, size = AI_CHUNK_SIZE, overlap = AI_CHUNK_OVERLAP): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\u0000/g, " ").trim();
  if (!cleaned) return [];
  if (cleaned.length <= size) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + size, cleaned.length);
    // Try to break on a paragraph or sentence boundary near the end.
    if (end < cleaned.length) {
      const window = cleaned.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
        window.lastIndexOf("! "),
      );
      if (breakAt > size * 0.5) end = start + breakAt + 1;
    }
    chunks.push(cleaned.slice(start, end).trim());
    if (end >= cleaned.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks.filter((c) => c.length > 0);
}

/** Call the Lovable embeddings endpoint for a batch of inputs. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = requireKey();
  const res = await fetch(`${AI_GATEWAY}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "nevo-ai-assistant",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) throw normaliseAiError(res.status, await res.text().catch(() => ""));
  const json = (await res.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };
  if (!json.data || json.data.length !== texts.length) {
    throw new Error("Embedding response length mismatch");
  }
  // Preserve request order via `index`.
  const ordered: number[][] = new Array(texts.length);
  for (const item of json.data) {
    const idx = typeof item.index === "number" ? item.index : 0;
    if (!Array.isArray(item.embedding)) throw new Error("Embedding missing");
    ordered[idx] = item.embedding;
  }
  return ordered;
}

/** Call the chat completions API (non-streaming) via Lovable AI Gateway. */
export async function chatComplete(params: {
  system: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
}): Promise<{ text: string; usage?: { prompt_tokens?: number; completion_tokens?: number } }> {
  const key = requireKey();
  const body: Record<string, unknown> = {
    model: CHAT_MODEL,
    messages: [{ role: "system", content: params.system }, ...params.messages],
  };
  if (params.maxTokens) body.max_completion_tokens = params.maxTokens;
  if (params.responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${AI_GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "nevo-ai-assistant",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw normaliseAiError(res.status, await res.text().catch(() => ""));
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  return { text, usage: json.usage };
}

/** Extract text from an uploaded file. Phase 1 supports text-based files only. */
export async function extractText(
  filename: string,
  contentType: string | null,
  bytes: ArrayBuffer,
): Promise<{ text: string; warning?: string }> {
  const lower = filename.toLowerCase();
  const isPlain =
    (contentType && /^text\//.test(contentType)) ||
    /\.(txt|md|markdown|csv|tsv|json|log|html?|xml|yaml|yml)$/i.test(lower);
  if (isPlain) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { text };
  }
  // Binary formats (PDF/DOCX/XLSX/images) are not yet parsed on the Worker runtime.
  return {
    text: "",
    warning: `Automatic text extraction is not yet available for ${filename}. The file is stored, but its contents will not be searchable until a follow-up ingestion adds parsing for this format.`,
  };
}

export const AI_MODELS = { chat: CHAT_MODEL, embedding: EMBEDDING_MODEL };
