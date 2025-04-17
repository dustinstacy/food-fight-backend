import globals from 'globals'
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import promisePlugin from 'eslint-plugin-promise'
import securityPlugin from 'eslint-plugin-security'
import prettierConfig from 'eslint-config-prettier'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },

  js.configs.recommended,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: { ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      promise: promisePlugin,
      security: securityPlugin,
    },
    rules: {
      ...tsPlugin.configs['eslint-recommended'].rules,
      ...tsPlugin.configs['recommended'].rules,
      ...importPlugin.configs['recommended'].rules,
      ...importPlugin.configs['typescript'].rules,
      ...promisePlugin.configs['recommended'].rules,
      ...securityPlugin.configs['recommended'].rules,

      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'always',
          mjs: 'always',
          cjs: 'always',
          ts: 'never',
          mts: 'never',
          cts: 'never',
        },
      ],
    },
    settings: {
      // Settings specifically for eslint-plugin-import
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts'], // Tell import plugin to use TS parser for TS files
      },
      'import/resolver': {
        typescript: {
          alwaysSearchExtensions: true,
          project: './tsconfig.json', // Important: Use tsconfig for alias/path resolution
        },
        node: true, // Fallback to node resolution
      },
    },
  },

  prettierConfig,
]
