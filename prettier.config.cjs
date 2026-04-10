'use strict';

const baseConfig = require('@viamrobotics/prettier-config');
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const resolvedConfig = baseConfig.default ?? baseConfig;

module.exports = {
  ...resolvedConfig,
  plugins: ['prettier-plugin-jsdoc'],
  tsdoc: true,
};
