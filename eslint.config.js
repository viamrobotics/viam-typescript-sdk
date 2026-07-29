// eslint.config.js
import js from '@eslint/js';
import tsdoc from 'eslint-plugin-tsdoc';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    plugins: {
      tsdoc,
      vitest,
    },

    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            'eslint.config.js',
            'prettier.config.mjs',
            'typedoc.config.mjs',
            'vite.config.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      eqeqeq: ['error', 'always'],
      'no-console': 'warn',
      'no-param-reassign': 'error',
      'no-void': ['error', { allowAsStatement: true }],

      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allow: [{ name: ['Error', 'URL', 'URLSearchParams'], from: 'lib' }],
          allowAny: true,
          allowBoolean: true,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: true,
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableBoolean: true,
        },
      ],

      // TODO: fix remaining violations and upgrade to error
      '@typescript-eslint/no-empty-interface': 'warn',
    },
  },

  globalIgnores([
    'src/gen',
    'src/genv1',
    '**/dist',
    '**/docs',
    '**/playwright-report',
    '**/vitest-report',
    '**/vitest-e2e-report',
    '**/examples',
    '**/scripts',
  ]),
  {
    files: [
      'src/**/*.test.*',
      'src/**/*.spec.*',
      'src/**/__tests__/**/*.spec.*',
      'src/**/__tests__/**/mocks/**',
      'e2e/**/*.spec.*',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
      'vitest/no-restricted-vi-methods': 'warn',
      'vitest/consistent-test-filename': [
        'warn',
        {
          pattern: '.*\\.spec\\.[tj]s$',
        },
      ],
      'vitest/valid-expect': 'error',
      'vitest/require-top-level-describe': 'error',
    },
  },
]);
