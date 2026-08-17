import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        /**
         * `prosemirror-codemirror-6` is published as ESM (`"type": "module"`) but its
         * internal re-exports omit the file extension (`export ... from './codemirror'`).
         * Left external, Node's strict ESM loader resolves those specifiers and fails
         * with `Cannot find module .../dist/codemirror`. Inlining the package routes it
         * through Vite's transform pipeline, which resolves the extensionless paths.
         *
         * Can be removed once the package ships valid ESM specifiers.
         */
        inline: [/prosemirror-codemirror-6/],
      },
    },
  },
});
