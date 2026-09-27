const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sassPath = path.join(root, 'sass/chosen.scss');
const names = ['chevrons', 'search', 'clear', 'clear-active'];
let sass = fs.readFileSync(sassPath, 'utf8');

for (const name of names) {
  const svg = fs.readFileSync(path.join(root, 'sass/icons', `${name}.svg`), 'utf8').trim();
  const encoded = Buffer.from(svg).toString('base64');
  const declaration = `$chosen-${name}: url('data:image/svg+xml;base64,${encoded}') !default;`;
  const existing = new RegExp(`^\\$chosen-${name}: url\\('data:image/svg\\+xml;base64,[^']+'\\) !default;$`, 'm');
  if (!existing.test(sass)) throw new Error(`Missing Sass declaration for ${name}`);
  sass = sass.replace(existing, declaration);
}

if (process.argv.includes('--check')) {
  if (sass !== fs.readFileSync(sassPath, 'utf8')) {
    throw new Error('Chosen Sass icons are out of sync with sass/icons/*.svg');
  }
} else if (sass !== fs.readFileSync(sassPath, 'utf8')) {
  fs.writeFileSync(sassPath, sass);
}
