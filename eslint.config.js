// eslint.config.js
'use strict';

import js from '@eslint/js';
import tsdoc from 'eslint-plugin-tsdoc';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    plugins: {
      tsdoc,
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      eqeqeq: ['error', 'always'],
      'no-console': 'warn',
      'no-param-reassign': 'error',
      'no-void': ['error', { allowAsStatement: true }],

      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
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
    files: ['src/**/*.test.*'],

    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
      'vitest/no-restricted-vi-methods': 'warn',
      'vitest/consistent-test-filename': 'warn',
      'vitest/valid-expect': 'error',
      'vitest/require-top-level-describe': 'error',
    },
  },
]);
