import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "dist-electron/**",
      "release/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Vue rules
  ...pluginVue.configs["flat/recommended"],

  // Vue + TypeScript parser config
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // Browser globals for Vue files
  {
    files: ["src/**/*.{vue,ts,js}"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        alert: "readonly",
        confirm: "readonly",
        KeyboardEvent: "readonly",
        HTMLElement: "readonly",
        Event: "readonly",
        MouseEvent: "readonly",
      },
    },
  },

  // Node globals for electron files
  {
    files: ["electron/**/*.ts"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        Buffer: "readonly",
      },
    },
  },

  // Custom rules
  {
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Vue
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "warn",
      "vue/require-default-prop": "off",
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always",
          },
        },
      ],

      // General
      "no-console": ["warn", { allow: ["warn", "error", "info", "log"] }],
      "prefer-const": "error",
      "no-var": "error",
    },
  }
);
