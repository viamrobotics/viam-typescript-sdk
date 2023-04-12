'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['./src/main.ts'],
  out: 'docs/dist',
  name: 'Viam SDK',
  customCss: './docs/docs.css',
  cname: 'ts.viam.dev',
};
