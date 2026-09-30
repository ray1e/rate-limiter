import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import { importX } from "eslint-plugin-import-x";
import eslintConfigPrettier from "eslint-config-prettier";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {
      js,
      importX,
    },
    extends: ["js/recommended, import-x/flat/recommend"],
    languageOptions: { globals: globals.node },
    languageOptions: { globals: globals.browser },
  },
  eslintConfigPrettier,
]);
