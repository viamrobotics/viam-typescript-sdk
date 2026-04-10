import { defineConfig, globalIgnores } from 'eslint/config';
import tsdoc from 'eslint-plugin-tsdoc';

import { baseConfig } from '@viamrobotics/eslint-config';

export default defineConfig([
  ...baseConfig,

  {
    plugins: {
      tsdoc,
    },

    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
      },
    },

    rules: {
      'no-void': [
        'error',
        {
          allowAsStatement: true,
        },
      ],

      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-promise-reject-errors': 'warn',
      'unicorn/prefer-add-event-listener': 'warn',

      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowNullableBoolean: true,
        },
      ],
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
      'vitest/no-restricted-vi-methods': 'warn',
      'vitest/valid-expect': 'warn',
      'vitest/require-top-level-describe': 'warn',
      'vitest/consistent-test-filename': 'warn',
    },
  },
]);
