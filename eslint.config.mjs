import js from "@eslint/js";
import solid from "eslint-plugin-solid";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**", "dist/**", ".tmp/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.tsx"],
    extends: [solid.configs.typescript],
    rules: {
      "solid/no-destructure": "error",
      "solid/reactivity": "error",
      "solid/no-react-specific-props": "error",
      "solid/prefer-show": "error",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly" },
    },
  },
);
