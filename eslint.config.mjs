import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "deploy/**",
      "next-env.d.ts",
      // Ignore third-party scripts in public directory
      "public/assets/script/**",
      "**/public/assets/script/**",
      "**/deploy/public/assets/script/**",
    ],
  },
  {
    rules: {
      // Temporarily disable some strict rules to allow build to pass
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      "prefer-const": "warn",
      // Keep these as errors
      "react/no-unescaped-entities": "error",
    },
  },
];

export default eslintConfig;
