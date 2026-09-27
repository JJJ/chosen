const fs = require('node:fs');
const path = require('node:path');
const { gzipSync } = require('node:zlib');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const bundle = fs.readFileSync(path.join(root, 'dist/react/index.mjs'));
const pack = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' }))[0];
const files = pack.files.map(file => file.path);
for (const expected of ['dist/react/index.mjs', 'dist/react/index.d.ts', 'dist/react/chosen.css']) {
  if (!files.includes(expected)) throw new Error(`Package is missing ${expected}`);
}
console.log(`React ESM bundle: ${bundle.length} bytes (${gzipSync(bundle).length} gzip), excluding React peer dependency`);
console.log(`npm package: ${pack.size} bytes compressed, ${pack.unpackedSize} bytes unpacked, ${pack.entryCount} files`);
