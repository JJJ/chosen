/* Exercise real touch events in WebKit, beyond the synthetic Jasmine events. */
const path = require('node:path');
const { devices, webkit } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const fixture = (name) => path.join(root, name);
const adapters = [
  { name: 'jQuery', library: 'node_modules/jquery/dist/jquery.min.js', chosen: 'docs/chosen.jquery.js' },
  { name: 'Prototype', library: 'docs/docsupport/prototype-1.7.0.0.js', chosen: 'docs/chosen.proto.js' },
];

async function main() {
  const browser = await webkit.launch({ headless: true });
  try {
    for (const adapter of adapters) {
      const context = await browser.newContext(devices['iPad (gen 7)']);
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
          <select id="choices" style="width:300px" multiple><option value="one">One</option><option value="two">Two</option></select>
        </body></html>`);
        await page.addStyleTag({ path: fixture('docs/chosen.css') });
        await page.addScriptTag({ path: fixture(adapter.library) });
        await page.addScriptTag({ path: fixture(adapter.chosen) });
        await page.evaluate((name) => {
          const select = document.querySelector('#choices');
          if (name === 'jQuery') window.jQuery(select).chosen();
          else new window.Chosen(select);
          window.__chosenTouchEvents = [];
          for (const type of ['touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
            document.addEventListener(type, (event) => {
              window.__chosenTouchEvents.push(`${type}: ${event.target.className || event.target.nodeName}; prevented=${event.defaultPrevented}`);
            });
          }
        }, adapter.name);

        await page.locator('.chosen-container').tap();
        await page.locator('.chosen-results .active-result').first().tap();
        if (!await page.locator('#choices option[value="one"]').evaluate((option) => option.selected)) {
          throw new Error(`${adapter.name}: tapping the result did not select the option`);
        }
        await page.locator('.search-choice-close').tap();
        if (await page.locator('#choices option[value="one"]').evaluate((option) => option.selected)) {
          const events = await page.evaluate(() => window.__chosenTouchEvents);
          throw new Error(`${adapter.name}: tapping remove did not deselect the option\n${events.join('\n')}`);
        }
        if (errors.length) throw new Error(`${adapter.name}: ${errors.join('; ')}`);
        console.log(`${adapter.name}: iPad WebKit select and immediate remove passed`);

        const retapPage = await context.newPage();
        retapPage.setDefaultTimeout(5000);
        const retapErrors = [];
        retapPage.on('pageerror', (error) => retapErrors.push(error.message));
        await retapPage.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
          <select id="choices" style="width:300px" multiple><option value="one">One</option><option value="two">Two</option></select>
        </body></html>`);
        await retapPage.addStyleTag({ path: fixture('docs/chosen.css') });
        await retapPage.addScriptTag({ path: fixture(adapter.library) });
        await retapPage.addScriptTag({ path: fixture(adapter.chosen) });
        await retapPage.evaluate((name) => {
          const select = document.querySelector('#choices');
          window.retapChosen = name === 'jQuery'
            ? window.jQuery(select).chosen().data('chosen')
            : new window.Chosen(select);
        }, adapter.name);
        await retapPage.locator('.chosen-container').tap();
        await retapPage.locator('.chosen-results .active-result').first().tap();
        if (await retapPage.evaluate(() => window.retapChosen.results_showing)) {
          throw new Error(`${adapter.name}: results stayed open after selecting an option`);
        }
        await retapPage.locator('.chosen-search-input').tap();
        if (!await retapPage.evaluate(() => window.retapChosen.results_showing)) {
          throw new Error(`${adapter.name}: tapping the active multi-select did not reopen its results`);
        }
        if (retapErrors.length) throw new Error(`${adapter.name}: ${retapErrors.join('; ')}`);
        console.log(`${adapter.name}: iPad WebKit retap opens results passed`);
      } finally {
        await context.close();
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
