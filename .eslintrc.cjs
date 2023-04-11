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
    curly: 'warn',
    'func-names': 'warn',
    'id-length': [
      'warn',
      {
        exceptions: [
          '_',
          'x',
          'y',
          'z',
          'w',
          'r',
          'i',
          'j',
          'k',
          'l',
          'h',
          'a',
          'b',
        ],
      },
    ],
    'lines-between-class-members': [
      'warn',
      'always',
      { exceptAfterSingleLine: true },
    ],
    'prefer-destructuring': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    'import/order': 'warn',
    'sonarjs/no-collapsible-if': 'warn',
    'sonarjs/prefer-immediate-return': 'warn',
    'unicorn/no-array-for-each': 'warn',
    'unicorn/catch-error-name': 'warn',
    'unicorn/filename-case': 'warn',
    'unicorn/no-instanceof-array': 'warn',
    'unicorn/no-lonely-if': 'warn',
    'unicorn/no-useless-undefined': 'warn',
    'unicorn/prefer-add-event-listener': 'warn',
    'unicorn/prefer-export-from': 'warn',
    'unicorn/prefer-optional-catch-binding': 'warn',
  },
};
