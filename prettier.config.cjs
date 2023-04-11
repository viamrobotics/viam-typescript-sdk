'use strict';

const baseConfig = require('@viamrobotics/prettier-config');

module.exports = {
  ...baseConfig,
  plugins: ['prettier-plugin-jsdoc'],
  tsdoc: true,
};
