// @ts-check
import tseslint from "typescript-eslint";
import rootConfig from "../../eslint.config.js";

export default tseslint.config(
  ...rootConfig,
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    rules: {},
  },
  {
    // `noPropertyAccessFromIndexSignature` is enabled, so reads of undeclared env vars
    // such as `process.env['PORT']` must use bracket notation or they fail to compile
    // with TS4111. The rule's `allowIndexSignaturePropertyAccess` option does not cover
    // this case, so the rule is disabled for the server entry point.
    files: ["**/server.ts"],
    rules: {
      "@typescript-eslint/dot-notation": "off",
    },
  }
);
