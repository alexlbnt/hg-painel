// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    ignores: ["dist/*", "api-old/*", "check*.js", "test*.js", "fix.js"],
    rules: {
      "import/no-unresolved": "off",
      "import/namespace": "off",
      "import/default": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-duplicates": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
]);
