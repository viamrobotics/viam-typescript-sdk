'use strict';

module.exports = {
  root: true,
  extends: ['@viamrobotics/eslint-config'],
  plugins: ['eslint-plugin-tsdoc'],
  ignorePatterns: [
    'src/gen',
    'dist',
    'docs',
    'playwright-report',
    'vitest-report',
    'vitest-e2e-report',
    /*
     * TODO(mc, 2023-04-06): something about nested node_modules in examples
     * is causing eslint to choke. Investigate workspaces as a solution
     */
    'examples',
    // TODO(RSDK-5406): setup custom linting rules for standalone JS scripts.
    'scripts',
  ],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json'],
  },
  rules: {
    'no-void': ['error', { allowAsStatement: true }],
    // TODO(mc, 2023-04-06): remove overrides to default to error, fix issues
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
  overrides: [
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
  ],
};
