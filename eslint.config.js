import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', '.husky/**']),
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    extends: [js.configs.recommended],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  ...vue.configs['flat/essential'],
  {
    files: ['src/**/*.{js,mjs,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  // Keep formatting exclusively in Prettier; this override must remain last.
  prettier,
])
