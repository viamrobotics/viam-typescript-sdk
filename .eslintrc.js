module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    worker: true,
  },
  extends: [
    'eslint:all',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'prettier',
  ],
  ignorePatterns: ['*.d.ts', 'src/examples', 'src/gen'],
  overrides: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: ['./tsconfig.json'],
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
  ],
  root: true,
  rules: {
    'array-bracket-newline': ['error', 'consistent'],
    'array-element-newline': 'off',
    'arrow-body-style': 'off',
    'camelcase': ['error', { properties: 'never' }],
    'comma-dangle': ['error', {
      arrays: 'always-multiline',
      exports: 'only-multiline',
      functions: 'never',
      imports: 'only-multiline',
      objects: 'always-multiline',
    }],
    'complexity': ['error', { max: 50 }],
    'default-case': 'off',
    'default-last-param': 'off',
    'dot-location': ['error', 'property'],
    'func-names': 'off',
    'function-call-argument-newline': ['error', 'consistent'],
    'id-length': 'off',
    'indent': ['error', 2],
    'init-declarations': 'off',
    'linebreak-style': ['error', 'unix'],
    'lines-around-comment': 'off',
    'lines-between-class-members': 'off',
    'max-len': ['error', { code: 140 }],
    'max-lines': 'off',
    'max-lines-per-function': 'off',
    'max-params': 'off',
    'max-statements': 'off',
    'multiline-ternary': ['error', 'always-multiline'],
    'no-bitwise': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-continue': 'off',
    'no-extra-parens': 'off',
    'no-magic-numbers': 'off',
    'no-negated-condition': 'off',
    'no-shadow': 'off', // https://github.com/typescript-eslint/typescript-eslint/issues/2483#issuecomment-687095358
    'no-ternary': 'off',
    'no-undefined': 'off',
    'object-curly-spacing': ['error', 'always'],
    'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    'one-var': ['error', 'never'],
    'padded-blocks': ['error', 'never'],
    'prefer-destructuring': 'off',
    'quote-props': ['error', 'consistent-as-needed'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'sort-imports': ['error', { 'allowSeparatedGroups': true }],
    '@typescript-eslint/prefer-for-of': 'off',
    '@typescript-eslint/no-shadow': ['error'], // https://github.com/typescript-eslint/typescript-eslint/issues/2483#issuecomment-687095358
    '@typescript-eslint/type-annotation-spacing': 'warn',
  },
}
