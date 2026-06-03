'use strict';

/** @satisfies {import('prettier').Config} */
module.exports = {
  singleQuote: true,
  jsxSingleQuote: true,
  singleAttributePerLine: true,
  trailingComma: 'es5',
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  quoteProps: 'as-needed',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  vueIndentScriptAndStyle: false,
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  plugins: ['prettier-plugin-jsdoc'],
  tsdoc: true,
};
