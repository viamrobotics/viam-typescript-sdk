'use strict';

/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['./src/main.ts'],
  out: 'docs/dist',
  name: 'Viam SDK',
  customCss: './docs/docs.css',
  cname: 'ts.viam.dev',
  // see: https://typedoc.org/options/organization/#kindsortorder
  kindSortOrder: [
    'Function',
    'Project',
    'Module',
    'Enum',
    'EnumMember',
    'Class',
    'Interface',
    'TypeAlias',
    'Constructor',
    'Property',
    'Variable',
    'Accessor',
    'Method',
    'ObjectLiteral',
    'Parameter',
    'TypeParameter',
    'TypeLiteral',
    'CallSignature',
    'ConstructorSignature',
    'IndexSignature',
    'GetSignature',
    'SetSignature',
    'Reference',
    'Namespace',
  ],
};
