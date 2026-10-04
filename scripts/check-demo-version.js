'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const lock = require(path.join(root, 'package-lock.json'));
const pages = [
  'index.template.html',
  'index.html',
  'index.proto.html',
  'options.html',
  'native.html',
  'react.html',
  'create-example.jquery.html',
  'create-example.proto.html',
];

function checkDemoVersion() {
  const errors = [];
  if (lock.version !== version || lock.packages[''].version !== version) {
    errors.push(`package-lock.json must use ${version} at the root`);
  }

  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, 'docs', page), 'utf8');
    const labels = [...html.matchAll(/<span id="latest-version">([^<]*)<\/span>/g)].map(match => match[1]);
    const expectedLabel = page.startsWith('create-example.') ? `v${version}` : version;
    if (labels.length === 0 || labels.some(label => label !== expectedLabel)) {
      errors.push(`docs/${page}: version labels must read ${expectedLabel}`);
    }

    const cacheKeys = [...html.matchAll(/\?ver=([^"'&\s]+)/g)].map(match => match[1]);
    if (cacheKeys.length === 0 || cacheKeys.some(key => key !== version && !key.startsWith(`${version}-`))) {
      errors.push(`docs/${page}: cache keys must start with ${version}`);
    }
  }

  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Demo version labels and cache keys match ${version}.`);
}

if (require.main === module) checkDemoVersion();
module.exports = checkDemoVersion;
