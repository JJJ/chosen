'use strict';

const fs = require('node:fs');
const path = require('node:path');

const docs = path.join(__dirname, '..', 'docs');
const source = fs.readFileSync(path.join(docs, 'index.template.html'), 'utf8');
const check = process.argv.includes('--check');
const targets = { jquery: 'index.html', prototype: 'index.proto.html' };

function render(mode) {
  let active = null;
  let output = '';
  for (const line of source.match(/[^\n]*\n|[^\n]+$/g) || []) {
    const marker = /^<!-- chosen-demo:(jquery|prototype|end) -->\r?\n$/.exec(line);
    if (marker) {
      if (marker[1] === 'end') {
        if (active === null) throw new Error('Unexpected end marker in demo template');
        active = null;
      } else {
        if (active !== null) throw new Error('Nested variant marker in demo template');
        active = marker[1];
      }
    } else if (active === null || active === mode) {
      output += line;
    }
  }
  if (active !== null) throw new Error('Unclosed variant marker in demo template');
  return output;
}

function build() {
  for (const [mode, filename] of Object.entries(targets)) {
    const target = path.join(docs, filename);
    const output = render(mode);
    if (check) {
      if (fs.readFileSync(target, 'utf8') !== output) {
        throw new Error(`${filename} differs from docs/index.template.html; run npm run build`);
      }
    } else if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
      fs.writeFileSync(target, output);
    }
  }
}

if (require.main === module) build();
module.exports = build;
