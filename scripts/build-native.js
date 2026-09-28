'use strict';
const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'native/Chosen.mjs');
const output = path.join(root, 'dist/native');
fs.mkdirSync(output, { recursive: true });
Promise.all([
  build({ entryPoints: [source], outfile: path.join(output, 'index.mjs'), bundle: true,
    format: 'esm', platform: 'browser', target: ['es2020'] }),
  build({ entryPoints: [source], outfile: path.join(output, 'index.cjs'), bundle: true,
    format: 'cjs', platform: 'node', target: ['node20'] }),
  build({ entryPoints: [source], outfile: path.join(output, 'chosen.native.js'), bundle: true,
    format: 'iife', globalName: 'ChosenNative', platform: 'browser', target: ['es2020'] })
]).then(() => {
  fs.copyFileSync(path.join(root, 'native/index.d.ts'), path.join(output, 'index.d.ts'));
  fs.copyFileSync(path.join(root, 'native/chosen.css'), path.join(output, 'chosen.css'));
  fs.copyFileSync(path.join(output, 'chosen.native.js'), path.join(root, 'docs/chosen.native.js'));
  fs.copyFileSync(path.join(output, 'chosen.css'), path.join(root, 'docs/chosen.native.css'));
}).catch(error => { console.error(error); process.exitCode = 1; });
