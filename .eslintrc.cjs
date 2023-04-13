'use strict';

module.exports = {
  root: true,
  extends: ['@viamrobotics/eslint-config'],
  ignorePatterns: [
    'src/gen',
    'dist',
    'docs',
    /*
     * TODO(mc, 2023-04-06): something about nested node_modules in examples
     * is causing eslint to choke. Investigate workspaces as a solution
     */
    'examples',
  ],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json'],
  },
  rules: {
    // TODO(mc, 2023-04-06): remove overrides to default to error, fix issues

    // 'prefer-destructuring': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    'unicorn/filename-case': 'warn',
    'unicorn/prefer-add-event-listener': 'warn',
  },
};
