// @ts-check
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import pegasus from "eslint-config-pegasus";

export default tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      pegasus.configs.default,
      ...pegasus.configs.typescript,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Angular 22 made OnPush the default change detection strategy. Components here
      // explicitly opt back in to `Eager` to preserve the pre-v22 behaviour they were
      // written against. Converting them to OnPush is a behavioural change that needs
      // per-component verification, so it is tracked separately from the v22 upgrade.
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      "@typescript-eslint/max-params": [
        "error",
        {
          max: 4,
        },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "ngx",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "ngx",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["projects/demo/**/*.ts"],
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
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  {
    files: ["scripts/**/*.js"],
    extends: [
      pegasus.configs.default,
      pegasus.configs.node,
    ],
    rules: {},
  },
  {
    files: [
      "docs/**/*.ts",
      "docs/**/*.tsx"
    ],
    extends: [
      pegasus.configs.default,
      pegasus.configs.typescript,
      pegasus.configs.react,
    ],
  },
  {
    files: [
      "scripts/**/*.js"
    ],
    extends: [
      pegasus.configs.default,
      pegasus.configs.node,
      pegasus.configs.browser,
    ],
    rules: {
      "no-console": "off"
    }
  }
);
