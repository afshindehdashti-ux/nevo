import { describe, it, expect } from "vitest";
import en from "../locales/en.json";
import ar from "../locales/ar.json";
import tr from "../locales/tr.json";
import ru from "../locales/ru.json";
import pt from "../locales/pt.json";
import de from "../locales/de.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import itLocale from "../locales/it.json";
import zh from "../locales/zh.json";
import { NAV_LABEL_KEYS } from "../nav-labels";

type Json = Record<string, unknown>;

function flatten(obj: Json, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Json, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

const LOCALES = { ar, tr, ru, pt, de, es, fr, it: itLocale, zh } as Record<string, Json>;
const EN = flatten(en as Json);

describe("locale parity", () => {
  it("every locale defines exactly the English key set", () => {
    for (const [code, dict] of Object.entries(LOCALES)) {
      const flat = flatten(dict);
      expect({ code, missing: Object.keys(EN).filter((k) => !(k in flat)) }).toEqual({
        code,
        missing: [],
      });
      expect({ code, extra: Object.keys(flat).filter((k) => !(k in EN)) }).toEqual({
        code,
        extra: [],
      });
    }
  });

  it("no locale blanks a string that English fills", () => {
    for (const [code, dict] of Object.entries(LOCALES)) {
      for (const [key, value] of Object.entries(flatten(dict))) {
        if (!EN[key]?.trim()) continue; // intentionally empty in English too
        expect(`${code}:${key}:${value.trim().length > 0}`).toBe(`${code}:${key}:true`);
      }
    }
  });
});

describe("nav label map", () => {
  it("maps every English nav string to a real translation key", () => {
    for (const [label, key] of Object.entries(NAV_LABEL_KEYS)) {
      expect({ label, key, exists: key in EN }).toEqual({ label, key, exists: true });
    }
  });

  it("maps each English string to a key whose English value matches it", () => {
    const mismatched = Object.entries(NAV_LABEL_KEYS).filter(
      ([label, key]) => EN[key] !== label && key !== "industries.faq.links.hub",
    );
    expect(mismatched).toEqual([]);
  });
});
