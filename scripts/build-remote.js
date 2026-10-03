'use strict';
const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist/remote');
fs.mkdirSync(output, { recursive: true });
Promise.all([
  build({ entryPoints: [path.join(root, 'remote/index.mjs')], outfile: path.join(output, 'index.mjs'),
    bundle: true, format: 'esm', platform: 'browser', target: ['es2020'] }),
  build({ entryPoints: [path.join(root, 'remote/index.mjs')], outfile: path.join(output, 'index.cjs'),
    bundle: true, format: 'cjs', platform: 'node', target: ['node20'] }),
  build({ entryPoints: [path.join(root, 'remote/index.mjs')], outfile: path.join(output, 'chosen.remote.js'),
    bundle: true, format: 'iife', globalName: 'ChosenRemote', platform: 'browser', target: ['es2020'] })
]).then(() => {
  fs.copyFileSync(path.join(root, 'remote/index.d.ts'), path.join(output, 'index.d.ts'));
  fs.copyFileSync(path.join(output, 'chosen.remote.js'), path.join(root, 'docs/chosen.remote.js'));
}).catch(error => { console.error(error); process.exitCode = 1; });
