import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

/**
 * Enterprise ESLint config
 * - Based on Next.js official recommendations
 * - Code quality and maintainability rules
 * - Security and best practices
 * - Import ordering and naming conventions
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  // ========== Enterprise extension rules ==========
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // App Router: use app dir instead of pages (suppress no-html-link-for-pages warning)
      "@next/next/no-html-link-for-pages": ["warn", "fronted/app/"],
      // --- Code complexity and maintainability ---
      // UI-heavy desktop components and editor hooks legitimately exceed
      // tutorial-style thresholds; keep lint focused on actionable issues.
      "complexity": ["warn", { max: 60 }],
      "max-depth": ["warn", { max: 5 }],
      "max-lines-per-function": ["warn", { max: 650, skipBlankLines: true, skipComments: true }],
      "max-params": ["warn", { max: 8 }],
      "max-nested-callbacks": ["warn", { max: 4 }],

      // --- Disable console in production (allow warn/error) ---
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // --- Security and best practices ---
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "warn",
      "no-return-await": "off",

      // --- TypeScript rules (non type-aware only) ---
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // These rules require parserOptions.project (type-aware); enable after typed lint:
      // "@typescript-eslint/prefer-nullish-coalescing", "prefer-optional-chain",
      // "no-floating-promises", "no-misused-promises", "await-thenable"

      // --- Import conventions ---
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
            "type",
          ],
          pathGroups: [
            { pattern: "react", group: "external", position: "before" },
            { pattern: "@/**", group: "internal", position: "before" },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          warnOnUnassignedImports: false,
        },
      ],
      "import/no-duplicates": "warn",
      // import/no-cycle is slow on large projects; enable if needed
      "import/no-cycle": "off",

      // --- React best practices ---
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/self-closing-comp": "warn",

      // --- Naming and style ---
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["warn", "always", { null: "ignore" }],
    },
  },
  // ========== Ignore rules ==========
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/next-env.d.ts",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/drizzle/**",
      "**/scripts/**",
    ],
  },
]

export default eslintConfig
