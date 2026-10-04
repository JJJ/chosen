/* Exercise the classic Tab regression in Firefox for both adapters. */
const path = require('node:path');
const { firefox } = require('playwright-core');
const { runTabNavigationFixture } = require('./tab-navigation-fixture');

const root = path.resolve(__dirname, '..');
const fixture = (name) => path.join(root, name);

async function main() {
  const browser = await firefox.launch({ headless: true });
  try {
    for (const adapter of [
      { name: 'jQuery', kind: 'jquery', scripts: ['node_modules/jquery/dist/jquery.min.js', 'docs/chosen.jquery.js'] },
      { name: 'Prototype', kind: 'proto', scripts: ['docs/docsupport/prototype-1.7.0.0.js', 'docs/chosen.proto.js'] },
    ]) {
      const page = await browser.newPage();
      try {
        await page.setContent('<!doctype html><html><head></head><body></body></html>');
        await page.addStyleTag({ path: fixture('docs/chosen.css') });
        for (const script of adapter.scripts) await page.addScriptTag({ path: fixture(script) });
        const errors = await runTabNavigationFixture(page, adapter.kind);
        if (errors.length) throw new Error(`${adapter.name}: ${errors.join('; ')}`);
        console.log(`${adapter.name}: scrolled Tab and Shift+Tab passed in Firefox`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
