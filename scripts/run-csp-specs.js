const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright-core');

const fixtures = path.resolve(__dirname, '../spec/fixtures/csp');
const docs = path.resolve(__dirname, '../docs');

async function check(engine, name) {
  const browser = await engine.launch(name === 'Chromium'
    ? { headless: true, ...(process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : { channel: 'chrome' }) }
    : { headless: true });
  try {
    for (const adapter of ['jquery', 'prototype']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.cspViolations = [];
        document.addEventListener('securitypolicyviolation', event => {
          window.cspViolations.push(event.effectiveDirective);
        });
      });
      await page.goto(pathToFileURL(path.join(fixtures, `${adapter}.html`)).href);
      assert.equal(await page.evaluate(() => !!window.cspFixture), true, `${name} ${adapter}: external init did not run`);
      await page.locator('#first_chosen').click();
      await page.locator('#first_chosen .chosen-results li.active-result').filter({ hasText: 'Atlas' }).click();
      await page.locator('#second_chosen').click();
      await page.locator('#second_chosen .chosen-results li.active-result').filter({ hasText: 'Beacon' }).click();
      const state = await page.evaluate(() => {
        const second = [];
        const options = document.querySelector('#second').options;
        for (let i = 0; i < options.length; i++) {
          if (options[i].selected) second.push(options[i].value);
        }
        return {
          first: document.querySelector('#first').value,
          second,
          width: getComputedStyle(document.querySelector('#first_chosen')).width,
          violations: window.cspViolations,
        };
      });
      assert.equal(state.first, 'Atlas', `${name} ${adapter}: single select did not update`);
      assert.deepEqual(state.second, ['Beacon'], `${name} ${adapter}: multiple select did not update`);
      assert.equal(state.width, '200px', `${name} ${adapter}: width did not apply`);
      assert.deepEqual(state.violations, [], `${name} ${adapter}: CSP violations`);
      assert.deepEqual(errors, [], `${name} ${adapter}: JavaScript errors`);
      await page.close();
    }
    for (const file of ['native.html', 'react.html']) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.cspViolations = [];
        document.addEventListener('securitypolicyviolation', event => {
          window.cspViolations.push(event.effectiveDirective);
        });
      });
      await page.goto(pathToFileURL(path.join(docs, file)).href);
      await page.locator('.chosen-native,.chosen-react').first().waitFor();
      assert.deepEqual(await page.evaluate(() => window.cspViolations), [], `${name} ${file}: CSP violations`);
      assert.deepEqual(errors, [], `${name} ${file}: JavaScript errors`);
      await page.close();
    }
    console.log(`${name}: strict CSP passed in all four editions`);
  } finally {
    await browser.close();
  }
}

(async () => {
  await check(chromium, 'Chromium');
  await check(webkit, 'WebKit');
})().catch(error => { console.error(error); process.exitCode = 1; });
