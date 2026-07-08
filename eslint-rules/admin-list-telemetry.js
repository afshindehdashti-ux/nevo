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

const validEmptyReason = {
  meta: {
    type: "problem",
    docs: {
      description:
        "<ListEmptyState reason=...> must be a static value from ADMIN_LIST_EMPTY_REASONS.",
    },
    schema: [],
    messages: {
      dynamic:
        "<ListEmptyState reason=...> must be a static string literal so admin_list_empty_shown emits an approved reason.",
      unknown:
        '<ListEmptyState reason="{{value}}"> is not an approved reason. Allowed: {{allowed}}.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return;
        if (node.name.name !== "ListEmptyState") return;

        const attr = findAttr(node, "reason");
        if (!attr) return; // reason is optional — omitted → "no_records"
        const value = literalAttrValue(attr);
        if (value === null) {
          context.report({ node: attr, messageId: "dynamic" });
          return;
        }
        if (!REASON_SET.has(value)) {
          context.report({
            node: attr,
            messageId: "unknown",
            data: { value, allowed: [...REASON_SET].join(", ") },
          });
        }
      },
    };
  },
};

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

export default {
  rules: {
    "valid-resource-prop": validResourceProp,
    "valid-empty-reason": validEmptyReason,
    "no-raw-empty-event": noRawEmptyEvent,
  },
};
