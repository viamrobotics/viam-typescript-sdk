'use strict';

const baseConfig = require('@viamrobotics/prettier-config');

const resolvedConfig = baseConfig.default ?? baseConfig;

module.exports = {
  ...resolvedConfig,
  plugins: ['prettier-plugin-jsdoc'],
  tsdoc: true,
};
