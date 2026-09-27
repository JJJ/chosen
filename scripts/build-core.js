/* Build the same pure core for legacy globals and modern package consumers. */
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'core/index.mjs');
const output = path.join(root, 'dist/core');

module.exports = function buildCore() {
  fs.mkdirSync(output, { recursive: true });
  esbuild.buildSync({
    entryPoints: [source],
    bundle: true,
    format: 'iife',
    globalName: 'ChosenCore',
    platform: 'browser',
    target: 'es5',
    outfile: path.join(output, 'index.iife.js'),
  });
  esbuild.buildSync({
    entryPoints: [source],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    outfile: path.join(output, 'index.cjs'),
  });
  fs.copyFileSync(source, path.join(output, 'index.mjs'));
  fs.copyFileSync(path.join(root, 'core/index.d.ts'), path.join(output, 'index.d.ts'));
};
