import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Repo-specific ignores (avoid scanning Python envs / large artifacts):
    "backend/**/.venv/**",
    "backend/**/venv/**",
    ".venv/**",
    "venv/**",
    "artifacts/**",
  ]),
  {
    rules: {
      // Allow <img> for dynamic base64 data URIs (Next/Image doesn't support them well)
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
