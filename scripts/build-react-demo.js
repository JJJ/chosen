const { build } = require('esbuild');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

async function main() {
  await build({
    entryPoints: [path.join(root, 'docs/docsupport/react-demo.jsx')],
    outfile: path.join(root, 'docs/docsupport/react-demo.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
    legalComments: 'none',
  });
  await fs.copyFile(path.join(root, 'react/chosen.css'), path.join(root, 'docs/chosen.react.css'));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
