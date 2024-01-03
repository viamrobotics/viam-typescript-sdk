'use strict';

module.exports = {
  root: true,
  extends: ['@viamrobotics/eslint-config'],
  plugins: ['eslint-plugin-tsdoc'],
  ignorePatterns: [
    'src/gen',
    'dist',
    'docs',
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
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'unicorn/prefer-add-event-listener': 'warn',
  },
  overrides: [
    {
      files: ['src/**/*.test.*'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
