const fs = require('node:fs');

const apiVersion = fs.readFileSync('./api_version.lock').toString().trim();
fs.writeFileSync(
  './src/api-version.ts',
  `export const apiVersion = "${apiVersion}";`
);
