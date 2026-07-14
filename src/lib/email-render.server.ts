import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

type RenderOptions = {
  plainText?: boolean;
};

const BREAK_TAGS =
  /<\/?(?:address|article|blockquote|br|div|footer|h[1-6]|header|hr|li|main|ol|p|section|table|td|th|tr|ul)\b[^>]*>/gi;
const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&apos;": "'",
  "&gt;": ">",
  "&lt;": "<",
  "&nbsp;": " ",
  "&quot;": '"',
};

function decodeEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&(amp|apos|gt|lt|nbsp|quot);/g, (entity) => NAMED_ENTITIES[entity] ?? entity);
}

function toPlainText(html: string) {
  return decodeEntities(
    html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(BREAK_TAGS, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export async function render(element: ReactElement, options: RenderOptions = {}) {
  const html = `<!doctype html>${renderToStaticMarkup(element)}`;
  return options.plainText ? toPlainText(html) : html;
}
