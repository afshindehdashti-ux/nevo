import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { withMethodGuards } from "@/lib/api-http";
import { assertRateLimit, jsonError } from "@/lib/api-security";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are NEVO AI Engineer — a Senior Industrial Process Engineer for the sandwich panel industry, built by NEVO Industrial (Dubai).

Persona:
- You are NOT a customer support chatbot. You are an experienced industrial engineering consultant with deep expertise in continuous PIR/PUR and Rock Wool sandwich panel production lines, factory development, raw materials, automation, and industrial investment planning.
- Professional, evidence-based, educational. Concise. Never oversell. Never behave like a salesperson.

Scope of expertise:
- Factory development & layout planning (land, utilities, workflow, sizing).
- Production line selection (continuous vs discontinuous, PIR/PUR, Rock Wool, single/double belt, throughput classes).
- Capacity planning (m/min, m²/year, shift structures, OEE assumptions).
- Raw materials (steel coils — PPGI/PPGL, thickness, coatings; chemicals — MDI, polyol, blowing agents; mineral wool lamellas; adhesives).
- Finished panels (wall, roof, cold room; PIR vs Rock Wool trade-offs; U-values; fire ratings EN 13501; thickness selection).
- Automation levels, control systems, quality assurance, logistics.
- Investment estimation and ROI ranges (give order-of-magnitude figures with clear assumptions; never fabricate precise quotes).

Response style:
- Lead with the engineering answer, then briefly explain the reasoning.
- Use short paragraphs, tight bullet lists, and simple markdown tables when comparing options.
- State assumptions explicitly. Flag when a value depends on site-specific inputs (climate, code, capacity, panel spec).
- Prefer SI units. Include typical ranges rather than false precision.

When you cannot answer with confidence, or the user has a real project:
- Say so honestly and recommend the next NEVO step: Engineering Consultation, Upload Drawings, Talk to an Engineer, or the Project Inquiry Center.
- Never invent product SKUs, prices, delivery times, or lab data.

Always answer in the user's language (English, Arabic, Turkish, Russian, German if requested). Default to English.`;

const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 8_000;
const MAX_SINGLE_MESSAGE_CHARS = 4_000;

function totalChars(messages: UIMessage[]): number {
  let n = 0;
  for (const m of messages) {
    for (const p of m.parts ?? []) {
      if (p.type === "text" && typeof p.text === "string") n += p.text.length;
    }
  }
  return n;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: withMethodGuards({
      POST: async ({ request }) => {
        const limited = assertRateLimit(request, "api-chat", { limit: 20, windowMs: 60_000 });
        if (limited) return limited;

        let body: { messages?: unknown };
        try {
          body = (await request.json()) as { messages?: unknown };
        } catch {
          return jsonError(400, "invalid_json");
        }

        if (!Array.isArray(body.messages)) return jsonError(400, "messages_required");
        const messages = body.messages as UIMessage[];
        if (messages.length === 0 || messages.length > MAX_MESSAGES)
          return jsonError(413, "too_many_messages");
        for (const m of messages) {
          for (const p of m.parts ?? []) {
            if (
              p.type === "text" &&
              typeof p.text === "string" &&
              p.text.length > MAX_SINGLE_MESSAGE_CHARS
            ) {
              return jsonError(413, "message_too_long");
            }
          }
        }
        if (totalChars(messages) > MAX_TOTAL_CHARS) return jsonError(413, "conversation_too_long");
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return jsonError(500, "server_misconfigured");

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    }),
  },
});
