import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react-x";
import hooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "coverage/**", "test-results/**", "playwright-report/**"] },
  js.configs.recommended,
  { files: ["**/*.{js,jsx,mjs,cjs}"], languageOptions: { ecmaVersion: "latest" },
    rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true }] } },
  { files: ["backend/**/*.js", "e2e/**/*.cjs"], languageOptions: { sourceType: "commonjs", globals: globals.node } },
  { files: ["**/*.mjs", "frontend/*.js", "e2e/**/*.js"], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ["frontend/src/**/*.{js,jsx}"],
    languageOptions: { sourceType: "module", globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-x": react, "react-hooks": hooks },
    rules: { "react-x/no-missing-key": "error", "react-x/no-duplicate-key": "error", "react-hooks/rules-of-hooks": "error" } },
];
