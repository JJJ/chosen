'use strict';
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright-core');

const demo = pathToFileURL(path.join(__dirname, '..', 'docs/native.html')).href;

async function check(name, engine) {
  const browser = await engine.launch(name === 'Chromium'
    ? { headless: true, ...(process.env.CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : { channel: 'chrome' }) }
    : { headless: true });
  try {
    const page = await browser.newPage({ bypassCSP: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(demo);
    const project = page.getByRole('combobox', { name: 'Project' });
    await project.click();
    await project.fill('bea');
    if (await page.getByRole('option', { name: 'Atlas' }).count()) throw new Error(`${name}: single search failed`);
    await page.getByRole('option', { name: 'Beacon' }).click();
    const selected = await page.evaluate(() => new FormData(document.querySelector('form')).get('project'));
    if (selected !== 'beacon') throw new Error(`${name}: native form value was ${selected}`);
    await project.press('ArrowDown');
    if (!await project.getAttribute('aria-activedescendant')) throw new Error(`${name}: no active keyboard option`);
    await project.press('Escape');
    if (await project.getAttribute('aria-expanded') !== 'false') throw new Error(`${name}: Escape failed`);
    await page.getByRole('button', { name: 'Clear selection' }).click();
    if (await page.evaluate(() => document.querySelector('#native-project').value) !== '') throw new Error(`${name}: clear failed`);
    const validity = await page.evaluate(() => {
      const select = document.querySelector('#native-project');
      select.form.requestSubmit();
      return { valid: select.checkValidity(), focus: document.activeElement?.id };
    });
    if (validity.valid || validity.focus !== 'native-project-native') {
      throw new Error(`${name}: required validation did not focus the visible control (${JSON.stringify(validity)})`);
    }
    await page.getByText('Project', { exact: true }).click();
    if (await project.evaluate(node => node !== document.activeElement)) throw new Error(`${name}: label did not focus input`);

    const skills = page.getByRole('combobox', { name: 'Skills' });
    await skills.click();
    await skills.fill('jav');
    await skills.press('Enter');
    const values = await page.evaluate(() => new FormData(document.querySelector('form')).getAll('skills'));
    if (JSON.stringify(values) !== '["javascript"]') throw new Error(`${name}: multiple keyboard selection failed`);
    await page.getByRole('button', { name: 'Remove JavaScript' }).click();
    if ((await page.evaluate(() => new FormData(document.querySelector('form')).getAll('skills'))).length) {
      throw new Error(`${name}: chip removal failed`);
    }
    await skills.press('Escape');
    await page.getByRole('button', { name: 'Add a project' }).click();
    await project.click();
    if (!await page.getByRole('option', { name: 'Project 1' }).count()) throw new Error(`${name}: update failed`);
    await page.getByRole('button', { name: 'Disable project' }).click();
    if (!await project.isDisabled()) throw new Error(`${name}: disabled update failed`);
    await page.getByRole('button', { name: 'Enable project' }).click();
    const external = await page.evaluate(() => {
      const select = document.querySelector('#native-project');
      select.value = 'comet';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return document.querySelector('.chosen-native__value').textContent;
    });
    if (external !== 'Comet') throw new Error(`${name}: external change did not synchronize`);
    await page.getByRole('button', { name: 'Reset form' }).click();
    await page.waitForFunction(() => document.querySelector('#native-project').value === '');
    if (errors.length) throw new Error(`${name}: ${errors.join('; ')}`);
    if (name === 'Chromium') {
      await page.addScriptTag({ path: path.join(__dirname, '..', 'node_modules/axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('main'))).violations);
      if (violations.length) throw new Error(`${name}: accessibility violations: ${violations.map(v => v.id).join(', ')}`);
    }
    if (name === 'WebKit') {
      const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
      await touch.goto(demo);
      const input = touch.getByRole('combobox', { name: 'Project' });
      await input.tap();
      await touch.getByRole('option', { name: 'Atlas' }).tap();
      const mobile = await touch.evaluate(() => ({
        value: document.querySelector('#native-project').value,
        fontSize: parseFloat(getComputedStyle(document.querySelector('.chosen-native__input')).fontSize),
        scale: visualViewport.scale
      }));
      if (mobile.value !== 'atlas' || mobile.fontSize < 16 || mobile.scale !== 1) {
        throw new Error(`${name}: touch selection or focus scale failed (${JSON.stringify(mobile)})`);
      }
      await touch.close();
    }
    console.log(`${name}: vanilla search, form, keyboard, update, touch, and accessibility checks passed`);
  } finally {
    await browser.close();
  }
}

Promise.all([check('Chromium', chromium), check('WebKit', webkit)])
  .catch(error => { console.error(error); process.exitCode = 1; });
