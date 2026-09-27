import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier/flat'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', '.husky/**']),
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    extends: [js.configs.recommended],
    rules: {
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    extends: [tseslint.configs.recommended],
    rules: { 'no-undef': 'off' },
  },
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['src/**/*.{js,mjs,ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['*.config.{js,mjs,cjs}', 'tests/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  // Keep formatting exclusively in Prettier; this override must remain last.
  prettier,
])
