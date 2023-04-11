'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['./src/main.ts'],
  out: 'docs',
  name: 'Viam Typescript SDK',
  readme: 'none',
  customCss: './docs.css',
};
