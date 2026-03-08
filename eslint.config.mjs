import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

/**
 * 企业级 ESLint 配置
 * - 基于 Next.js 官方推荐
 * - 代码质量与可维护性规则
 * - 安全与最佳实践
 * - 导入排序与命名规范
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  // ========== 企业级扩展规则 ==========
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      // App Router：指定 app 目录替代 pages（消除 no-html-link-for-pages 警告）
      "@next/next/no-html-link-for-pages": ["warn", "fronted/app/"],
      // --- 代码复杂度与可维护性 ---
      "complexity": ["warn", { max: 15 }],
      "max-depth": ["warn", { max: 4 }],
      "max-lines-per-function": ["warn", { max: 200, skipBlankLines: true, skipComments: true }],
      "max-params": ["warn", { max: 8 }],
      "max-nested-callbacks": ["warn", { max: 4 }],

      // --- 生产环境禁止 console（保留 warn/error）---
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // --- 安全与最佳实践 ---
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "warn",
      "no-return-await": "off",

      // --- TypeScript 规则（仅使用非 type-aware 规则）---
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // 以下规则需 parserOptions.project（type-aware），可启用 typed lint 后放开：
      // "@typescript-eslint/prefer-nullish-coalescing", "prefer-optional-chain",
      // "no-floating-promises", "no-misused-promises", "await-thenable"

      // --- 导入规范 ---
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
      // import/no-cycle 在大项目中较慢，可按需开启
      "import/no-cycle": "off",

      // --- React 最佳实践 ---
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/self-closing-comp": "warn",

      // --- 命名与风格 ---
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["warn", "always", { null: "ignore" }],
    },
  },
  // ========== 忽略规则 ==========
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
