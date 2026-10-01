const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright-core');

const docs = path.resolve(__dirname, '../docs');

async function check(engine, name) {
  const browser = await engine.launch(name === 'Chromium'
    ? { headless: true, ...(process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : { channel: 'chrome' }) }
    : { headless: true });
  try {
    for (const file of ['index.html', 'index.proto.html', 'native.html', 'react.html']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.join(docs, file)).href);
      const classic = file.startsWith('index');
      const section = classic ? page.locator('#remote_select_chosen') : page.locator('#remote-source-integration');
      const input = section.locator('input').first();
      const status = page.locator(classic ? '#remote-status' : '#remote-source-integration output').first();
      await input.click();
      await input.fill('be');
      await status.getByText('2 projects returned.', { exact: false }).waitFor();
      const beacon = classic
        ? section.locator('.chosen-results li.active-result').filter({ hasText: 'Beacon' })
        : section.getByRole('option', { name: 'Beacon', exact: true });
      await beacon.first().click();
      await input.fill('co');
      await status.getByText('3 projects returned.', { exact: false }).waitFor();
      const select = classic ? '#remote-select' : file === 'native.html'
        ? '#native-suite-remote-source-integration' : 'select[name="suite-remote-source-integration"]';
      const values = await page.locator(select).evaluate(element => {
        const selected = [];
        for (let i = 0; i < element.options.length; i++) {
          if (element.options[i].selected) selected.push(element.options[i].value);
        }
        return selected;
      });
      assert.deepEqual(values, ['atlas', 'beacon'], `${name} ${file}: selected native values changed`);
      assert.deepEqual(errors, [], `${name} ${file}: page error`);
      await page.close();
    }
    console.log(`${name}: remote demo search and native value retention passed in four editions`);
  } finally {
    await browser.close();
  }
}

(async () => {
  await check(chromium, 'Chromium');
  await check(webkit, 'WebKit');
})().catch(error => { console.error(error); process.exitCode = 1; });
