import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import adminListTelemetry from "./eslint-rules/admin-list-telemetry.js";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", "templates/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "admin-list-telemetry": adminListTelemetry,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "admin-list-telemetry/valid-resource-prop": "error",
      "admin-list-telemetry/valid-empty-reason": "error",
      "admin-list-telemetry/no-raw-empty-event": "error",
    },
  },
  {
    files: ["src/components/ui/**/*.tsx", "src/i18n/LanguageProvider.tsx"],
    rules: {
      // UI primitives and the language provider intentionally export helper
      // functions alongside components; fast-refresh warnings are noise here.
      "react-refresh/only-export-components": "off",
    },
  },
  {
    // Test files reference the guarded components with intentionally invalid
    // props to prove the runtime/type contracts — skip the JSX telemetry
    // rules there. The `no-raw-empty-event` rule still applies to catch
    // stray logClientEvent calls in test helpers.
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}", "**/*.stories.tsx"],
    rules: {
      "admin-list-telemetry/valid-resource-prop": "off",
      "admin-list-telemetry/valid-empty-reason": "off",
    },
  },
  eslintPluginPrettier,
);

