'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['./src/main.ts'],
  out: 'docs',
  name: 'Viam SDK',
  customCss: './docs.css',
  cname: 'ts.viam.dev',
};
