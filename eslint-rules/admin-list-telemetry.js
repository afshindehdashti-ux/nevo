/**
 * ESLint plugin: enforces admin_list_empty_shown telemetry contracts.
 *
 * Rules:
 *   admin-list-telemetry/valid-resource-prop
 *     - <AdminListPage>, <ListEmptyState>, <ListErrorState> must receive
 *       a `resource` prop that is a string literal in ADMIN_LIST_RESOURCES.
 *     - Dynamic/JSX-expression resource values are rejected (must be a
 *       static literal so the CI grep + static guard can verify it).
 *
 *   admin-list-telemetry/valid-empty-reason
 *     - When <ListEmptyState> receives a `reason` prop, its value must be
 *       a string literal in ADMIN_LIST_EMPTY_REASONS.
 *
 *   admin-list-telemetry/no-raw-empty-event
 *     - Direct calls to logClientEvent("admin_list_empty_shown", …) are
 *       forbidden outside the shared ListEmptyState component. When
 *       exceptionally allowed, the payload MUST include a string-literal
 *       `resource` in ADMIN_LIST_RESOURCES and a string-literal `reason`
 *       in ADMIN_LIST_EMPTY_REASONS.
 *
 * The allowed slugs and reasons are parsed at load time from
 * src/components/admin/list-telemetry.ts so this rule and the TypeScript
 * types share a single source of truth.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TELEMETRY_SRC = resolve(HERE, "../src/components/admin/list-telemetry.ts");

function parseStringTuple(source, exportName) {
  const re = new RegExp(
    `export const ${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`,
    "m",
  );
  const match = source.match(re);
  if (!match) {
    throw new Error(
      `admin-list-telemetry ESLint rule: could not find "${exportName}" in ${TELEMETRY_SRC}`,
    );
  }
  return Array.from(match[1].matchAll(/["']([^"']+)["']/g)).map((m) => m[1]);
}

const telemetrySource = readFileSync(TELEMETRY_SRC, "utf8");
const RESOURCES = parseStringTuple(telemetrySource, "ADMIN_LIST_RESOURCES");
const REASONS = parseStringTuple(telemetrySource, "ADMIN_LIST_EMPTY_REASONS");

const RESOURCE_SET = new Set(RESOURCES);
const REASON_SET = new Set(REASONS);

const GUARDED_COMPONENTS = new Set([
  "AdminListPage",
  "ListEmptyState",
  "ListErrorState",
]);

/** Extract a string-literal value from a JSXAttribute, or null if dynamic. */
function literalAttrValue(attr) {
  if (!attr || !attr.value) return null;
  if (attr.value.type === "Literal" && typeof attr.value.value === "string") {
    return attr.value.value;
  }
  if (
    attr.value.type === "JSXExpressionContainer" &&
    attr.value.expression.type === "Literal" &&
    typeof attr.value.expression.value === "string"
  ) {
    return attr.value.expression.value;
  }
  return null; // dynamic — {foo}, template, identifier, etc.
}

function findAttr(node, name) {
  return node.attributes.find(
    (a) => a.type === "JSXAttribute" && a.name && a.name.name === name,
  );
}

const validResourceProp = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Guarded admin list components must receive a static `resource` prop from the ADMIN_LIST_RESOURCES registry.",
    },
    schema: [],
    messages: {
      missing:
        "<{{component}}> is missing the required `resource` prop. Add one from ADMIN_LIST_RESOURCES so admin_list_empty_shown emits with the correct slug.",
      dynamic:
        "<{{component}} resource=...> must be a static string literal so the telemetry CI guard can verify it.",
      unknown:
        '<{{component}} resource="{{value}}"> is not registered in ADMIN_LIST_RESOURCES. Allowed: {{allowed}}. Register the slug in src/components/admin/list-telemetry.ts first.',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    // AdminListPage.tsx is the shared wrapper that forwards `resource` /
    // `reason` from typed props to <ListEmptyState> / <ListErrorState>.
    // The types already enforce the union at every call site, and the
    // literal never appears inside this file — skip.
    if (/[\\/]components[\\/]admin[\\/]AdminListPage\.tsx?$/.test(filename)) {
      return {};
    }
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        const name = node.name.name;
        if (!GUARDED_COMPONENTS.has(name)) return;


        const attr = findAttr(node, "resource");
        if (!attr) {
          context.report({ node, messageId: "missing", data: { component: name } });
          return;
        }
        const value = literalAttrValue(attr);
        if (value === null) {
          context.report({ node: attr, messageId: "dynamic", data: { component: name } });
          return;
        }
        if (!RESOURCE_SET.has(value)) {
          context.report({
            node: attr,
            messageId: "unknown",
            data: {
              component: name,
              value,
              allowed: [...RESOURCE_SET].join(", "),
            },
          });
        }
      },
    };
  },
};

/**
 * Levenshtein distance — small, dependency-free. Used to pick the
 * "closest" approved reason for the ESLint auto-fixer. We only auto-fix
 * when a single approved reason is unambiguously closest AND close
 * enough (distance <= AUTOFIX_MAX_DISTANCE); otherwise the rule reports
 * a hard error listing the allowed values so a human picks.
 */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

const AUTOFIX_MAX_DISTANCE = 3;

/**
 * @returns { suggestion: string, distance: number, unambiguous: boolean }
 *          when a nearest match exists inside the distance budget, or null.
 *          `unambiguous` is false when two approved reasons tie for
 *          closest — in that case we refuse to auto-fix.
 */
function nearestReason(bad, approved) {
  let best = null;
  let bestDist = Infinity;
  let tie = false;
  for (const candidate of approved) {
    const d = levenshtein(bad, candidate);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
      tie = false;
    } else if (d === bestDist) {
      tie = true;
    }
  }
  if (best === null || bestDist > AUTOFIX_MAX_DISTANCE) return null;
  return { suggestion: best, distance: bestDist, unambiguous: !tie };
}

const validEmptyReason = {
  meta: {
    type: "problem",
    fixable: "code",
    hasSuggestions: true,
    docs: {
      description:
        "<ListEmptyState reason=...> must be a static value from ADMIN_LIST_EMPTY_REASONS. Auto-fixes a close typo to the nearest approved value; fails hard when no clear match exists.",
    },
    schema: [],
    messages: {
      dynamic:
        "<ListEmptyState reason=...> must be a static string literal so admin_list_empty_shown emits an approved reason. Allowed: {{allowed}}.",
      unknownNoMatch:
        '<ListEmptyState reason="{{value}}"> is not an approved reason and is not close enough to any known value to auto-fix. Allowed: {{allowed}}.',
      unknownAmbiguous:
        '<ListEmptyState reason="{{value}}"> is not approved and is equidistant from multiple allowed values (nearest ties, distance {{distance}}). Refusing to auto-fix — pick one manually. Allowed: {{allowed}}.',
      unknownAutofixed:
        '<ListEmptyState reason="{{value}}"> is not approved. Auto-fixed to the nearest match "{{suggestion}}" (distance {{distance}}). Allowed: {{allowed}}.',
      suggestReplace:
        'Replace with "{{suggestion}}"',
    },
  },
  create(context) {
    const approved = [...REASON_SET];
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (node.name.name !== "ListEmptyState") return;

        const attr = findAttr(node, "reason");
        if (!attr) return; // reason is optional — omitted → "no_records"
        const value = literalAttrValue(attr);
        if (value === null) {
          context.report({
            node: attr,
            messageId: "dynamic",
            data: { allowed: approved.join(", ") },
          });
          return;
        }
        if (REASON_SET.has(value)) return;

        const near = nearestReason(value, approved);

        // No usable nearest neighbour — hard failure, no auto-fix, no suggestion.
        if (!near) {
          context.report({
            node: attr,
            messageId: "unknownNoMatch",
            data: { value, allowed: approved.join(", ") },
          });
          return;
        }

        // Ambiguous nearest (tie) — refuse to guess; surface a suggestion list
        // so a human can pick, but do NOT auto-fix.
        if (!near.unambiguous) {
          context.report({
            node: attr,
            messageId: "unknownAmbiguous",
            data: {
              value,
              distance: String(near.distance),
              allowed: approved.join(", "),
            },
            suggest: approved.map((candidate) => ({
              messageId: "suggestReplace",
              data: { suggestion: candidate },
              fix(fixer) {
                return replaceAttrLiteral(fixer, attr, candidate);
              },
            })),
          });
          return;
        }

        // Unambiguous, close enough — safe to auto-fix.
        context.report({
          node: attr,
          messageId: "unknownAutofixed",
          data: {
            value,
            suggestion: near.suggestion,
            distance: String(near.distance),
            allowed: approved.join(", "),
          },
          fix(fixer) {
            return replaceAttrLiteral(fixer, attr, near.suggestion);
          },
        });
      },
    };
  },
};

/**
 * Rewrite a JSX attribute's value to the given string literal, preserving
 * the original quote style / expression container. Handles both
 * `reason="foo"` and `reason={"foo"}`.
 */
function replaceAttrLiteral(fixer, attr, newValue) {
  const val = attr.value;
  if (!val) return null;
  const escaped = newValue.replace(/"/g, '\\"');
  if (val.type === "Literal") {
    return fixer.replaceText(val, `"${escaped}"`);
  }
  if (val.type === "JSXExpressionContainer") {
    return fixer.replaceText(val, `{"${escaped}"}`);
  }
  return null;
}


/** Find a Property in an ObjectExpression whose key is `name`. */
function findProp(obj, name) {
  if (!obj || obj.type !== "ObjectExpression") return null;
  return (
    obj.properties.find(
      (p) =>
        p.type === "Property" &&
        !p.computed &&
        ((p.key.type === "Identifier" && p.key.name === name) ||
          (p.key.type === "Literal" && p.key.value === name)),
    ) || null
  );
}

function literalStringValue(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  return null;
}

const noRawEmptyEvent = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Direct logClientEvent("admin_list_empty_shown", ...) calls are forbidden outside ListEmptyState.',
    },
    schema: [],
    messages: {
      forbidden:
        'Do not call logClientEvent("admin_list_empty_shown", ...) directly. Render <ListEmptyState resource=... /> and let it emit the event.',
      badResource:
        'admin_list_empty_shown payload must include a static resource string in ADMIN_LIST_RESOURCES. Allowed: {{allowed}}.',
      badReason:
        'admin_list_empty_shown payload must include a static reason string in ADMIN_LIST_EMPTY_REASONS. Allowed: {{allowed}}.',
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    // ListEmptyState.tsx is the ONLY module allowed to emit this event.
    const isListEmptyStateModule = /[\\/]components[\\/]admin[\\/]ListEmptyState\.tsx?$/.test(
      filename,
    );

    return {
      CallExpression(node) {
        const callee = node.callee;
        const isTargetCall =
          (callee.type === "Identifier" && callee.name === "logClientEvent") ||
          (callee.type === "MemberExpression" &&
            callee.property.type === "Identifier" &&
            callee.property.name === "logClientEvent");
        if (!isTargetCall) return;

        const [eventArg, payloadArg] = node.arguments;
        if (literalStringValue(eventArg) !== "admin_list_empty_shown") return;

        if (!isListEmptyStateModule) {
          context.report({ node, messageId: "forbidden" });
          return;
        }
        // Inside ListEmptyState.tsx — still validate the payload shape when
        // it's an object literal (best-effort; dynamic payloads are fine
        // because that module builds them from typed props).
        const resourceProp = findProp(payloadArg, "resource");
        if (resourceProp) {
          const v = literalStringValue(resourceProp.value);
          if (v !== null && !RESOURCE_SET.has(v)) {
            context.report({
              node: resourceProp,
              messageId: "badResource",
              data: { allowed: [...RESOURCE_SET].join(", ") },
            });
          }
        }
        const reasonProp = findProp(payloadArg, "reason");
        if (reasonProp) {
          const v = literalStringValue(reasonProp.value);
          if (v !== null && !REASON_SET.has(v)) {
            context.report({
              node: reasonProp,
              messageId: "badReason",
              data: { allowed: [...REASON_SET].join(", ") },
            });
          }
        }
      },
    };
  },
};

/**
 * A JSX attribute is "truthy" (i.e. actually enables the flag) when it is
 * present with no value (shorthand `<X flag />`), `={true}`, or a
 * non-empty string literal. Explicit `={false}` and dynamic expressions
 * we can't statically prove are treated as "not conclusively enabled".
 */
function jsxAttrIsTruthy(attr) {
  if (!attr) return false;
  if (!attr.value) return true; // <X flag />
  if (attr.value.type === "Literal") return Boolean(attr.value.value);
  if (attr.value.type === "JSXExpressionContainer") {
    const expr = attr.value.expression;
    if (expr.type === "Literal") return Boolean(expr.value);
    return false;
  }
  return false;
}

/** ObjectExpression property counts as truthy only for `true` or a non-empty string literal. */
function objectPropIsTruthy(prop) {
  if (!prop || !prop.value) return false;
  const v = prop.value;
  if (v.type === "Literal") return Boolean(v.value);
  return false;
}

const noConflictingEmptyFlags = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`filtersActive` and `expectSeed` are mutually exclusive — they map to conflicting admin_list_empty_shown reasons (filtered_out vs seed_missing).",
    },
    schema: [],
    messages: {
      jsxConflict:
        '<{{component}}> sets both `filtersActive` and `expectSeed`. They map to conflicting admin_list_empty_shown reasons (filtered_out vs seed_missing). Pick one, or omit both to emit reason="no_records".',
      objectConflict:
        '<AdminListPage empty={{ filtersActive, expectSeed }}> sets both flags. They map to conflicting admin_list_empty_shown reasons (filtered_out vs seed_missing). Pick one, or omit both to emit reason="no_records".',
    },
  },
  create(context) {
    return {
      // Case 1: direct JSX props on <ListEmptyState>.
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (node.name.name !== "ListEmptyState") return;
        const filters = findAttr(node, "filtersActive");
        const seed = findAttr(node, "expectSeed");
        if (jsxAttrIsTruthy(filters) && jsxAttrIsTruthy(seed)) {
          context.report({
            node,
            messageId: "jsxConflict",
            data: { component: "ListEmptyState" },
          });
        }
      },
      // Case 2: object-literal `empty={{ filtersActive, expectSeed }}` on
      // <AdminListPage> (the shared wrapper forwards them to ListEmptyState).
      JSXAttribute(node) {
        if (!node.name || node.name.name !== "empty") return;
        const parent = node.parent;
        if (
          !parent ||
          parent.type !== "JSXOpeningElement" ||
          parent.name.type !== "JSXIdentifier" ||
          parent.name.name !== "AdminListPage"
        ) {
          return;
        }
        const value = node.value;
        if (!value || value.type !== "JSXExpressionContainer") return;
        const obj = value.expression;
        if (!obj || obj.type !== "ObjectExpression") return;
        const filters = findProp(obj, "filtersActive");
        const seed = findProp(obj, "expectSeed");
        if (objectPropIsTruthy(filters) && objectPropIsTruthy(seed)) {
          context.report({ node, messageId: "objectConflict" });
        }
      },
    };
  },
};

export default {
  rules: {
    "valid-resource-prop": validResourceProp,
    "valid-empty-reason": validEmptyReason,
    "no-raw-empty-event": noRawEmptyEvent,
    "no-conflicting-empty-flags": noConflictingEmptyFlags,
  },
};

