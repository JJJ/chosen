const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist/react');
fs.mkdirSync(output, { recursive: true });

build({
  entryPoints: [path.join(root, 'react/Chosen.jsx')],
  outfile: path.join(output, 'index.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: ['es2020'],
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  minify: true,
  legalComments: 'none'
}).then(() => {
  fs.copyFileSync(path.join(root, 'react/index.d.ts'), path.join(output, 'index.d.ts'));
  fs.copyFileSync(path.join(root, 'react/chosen.css'), path.join(output, 'chosen.css'));
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
