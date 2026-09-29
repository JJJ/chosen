const path = require('node:path');
const { build } = require('esbuild');
const { chromium, webkit } = require('playwright-core');

const root = path.resolve(__dirname, '..');

async function main() {
  const bundle = await build({
    entryPoints: [path.join(root, 'spec/react/browser-entry.jsx')],
    write: false,
    bundle: true,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' }
  });

  for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
    const browser = await engine.launch(name === 'Chromium'
      ? { headless: true, ...(process.env.CHROME_EXECUTABLE_PATH
        ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : { channel: 'chrome' }) }
      : { headless: true });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
      await page.addStyleTag({ path: path.join(root, 'dist/react/chosen.css') });
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const input = page.getByRole('combobox', { name: 'Fruit' });
      await input.waitFor();
      await input.click();
      await input.fill('ban');
      if (await page.getByRole('option', { name: 'Apple' }).count()) throw new Error(`${name}: search did not filter`);
      await page.getByRole('option', { name: 'Banana' }).click();
      const formValue = await page.evaluate(() => new FormData(document.querySelector('form')).get('fruit'));
      if (formValue !== 'banana') throw new Error(`${name}: native form value was ${formValue}`);
      await input.press('ArrowDown');
      const active = await input.getAttribute('aria-activedescendant');
      if (!active) throw new Error(`${name}: keyboard focus did not expose an active option`);
      await input.press('Escape');
      if (await input.getAttribute('aria-expanded') !== 'false') throw new Error(`${name}: Escape did not close results`);

      await page.evaluate(() => window.mountChosen({ required: true, value: '' }));
      await page.waitForFunction(() => document.querySelector('select')?.value === '');
      const invalidFocus = await page.evaluate(() => {
        document.querySelector('form').requestSubmit();
        return { valid: document.querySelector('select').checkValidity(), focused: document.activeElement?.id };
      });
      if (invalidFocus.valid || invalidFocus.focused !== 'fruit-input') {
        throw new Error(`${name}: invalid form did not focus visible combobox (${JSON.stringify(invalidFocus)})`);
      }

      await page.evaluate(() => window.mountChosen({ value: 'banana' }));
      await page.waitForFunction(() => document.querySelector('select')?.value === 'banana');
      const controlledReset = await page.evaluate(() => {
        document.querySelector('form').reset();
        return new FormData(document.querySelector('form')).get('fruit');
      });
      if (controlledReset !== 'banana') throw new Error(`${name}: controlled form reset changed the native value to ${controlledReset}`);

      await page.evaluate(() => window.mountChosen({ multiple: true, required: true,
        deselectSelectedResults: true, hideResultsOnSelect: false }));
      await page.waitForFunction(() => document.querySelector('select')?.multiple);
      await page.evaluate(() => document.querySelector('form').reset());
      await page.waitForFunction(() => new FormData(document.querySelector('form')).getAll('fruit').length === 0);
      await page.getByText('Fruit', { exact: true }).click();
      if (await page.getByRole('combobox', { name: 'Fruit' }).getAttribute('aria-expanded') !== 'true') {
        throw new Error(`${name}: multiple label did not open the results`);
      }
      await page.getByRole('option', { name: 'Apple' }).click();
      await page.getByRole('option', { name: 'Banana' }).click();
      const values = await page.evaluate(() => new FormData(document.querySelector('form')).getAll('fruit'));
      if (JSON.stringify(values) !== JSON.stringify(['apple', 'banana'])) {
        throw new Error(`${name}: multiple native form values were ${JSON.stringify(values)}`);
      }
      await page.getByRole('option', { name: 'Apple' }).click();
      const toggledValues = await page.evaluate(() => new FormData(document.querySelector('form')).getAll('fruit'));
      if (JSON.stringify(toggledValues) !== JSON.stringify(['banana'])) {
        throw new Error(`${name}: selected result did not toggle off (${JSON.stringify(toggledValues)})`);
      }
      if (name === 'Chromium') {
        await page.addScriptTag({ path: path.join(root, 'node_modules/axe-core/axe.min.js') });
        const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('#root'))).violations);
        if (violations.length) throw new Error(`${name}: accessibility violations: ${violations.map(v =>
          `${v.id} (${v.nodes.map(node => `${node.target.join(' ')}: ${node.failureSummary}`).join('; ')})`).join(', ')}`);
      }
      const themedBackground = await page.evaluate(() => {
        const host = document.querySelector('.chosen-react');
        host.style.setProperty('--chosen-control-background', '#f0f9ff');
        return getComputedStyle(host.querySelector('.chosen-react__control')).backgroundColor;
      });
      if (themedBackground !== 'rgb(240, 249, 255)') throw new Error(`${name}: theme token did not apply`);
      await page.evaluate(() => window.mountChosen({ width: '180px', dropdownWidth: '150%', dropdownPosition: 'fixed' }));
      await page.waitForFunction(() => document.querySelector('.chosen-react')?.style.width === '180px');
      await page.getByRole('combobox', { name: 'Fruit' }).click();
      const layout = await page.evaluate(() => {
        const host = document.querySelector('.chosen-react');
        const control = host.querySelector('.chosen-react__control').getBoundingClientRect();
        const popup = host.querySelector('.chosen-react__popup');
        const rect = popup.getBoundingClientRect();
        return { position: getComputedStyle(popup).position, controlWidth: control.width,
          popupWidth: rect.width, aligned: Math.abs(rect.left - control.left) < 2 };
      });
      if (layout.position !== 'fixed' || Math.abs(layout.popupWidth - 270) > 2 || !layout.aligned) {
        throw new Error(`${name}: React fixed wider dropdown layout failed (${JSON.stringify(layout)})`);
      }
      await page.evaluate(() => { document.body.style.minHeight = '300vh'; window.scrollBy(0, 60); });
      await page.waitForFunction(() => {
        const bottom = document.querySelector('.chosen-react__control').getBoundingClientRect().bottom;
        const top = document.querySelector('.chosen-react__popup').getBoundingClientRect().top;
        return Math.abs(top - bottom) < 3;
      }, null, { timeout: 1000 });
      const scrolled = await page.evaluate(() => ({
        bottom: document.querySelector('.chosen-react__control').getBoundingClientRect().bottom,
        top: document.querySelector('.chosen-react__popup').getBoundingClientRect().top
      }));
      if (Math.abs(scrolled.top - scrolled.bottom) > 3) {
        throw new Error(`${name}: React fixed dropdown did not follow page scroll (${JSON.stringify(scrolled)})`);
      }
      await page.evaluate(() => window.mountChosen({ createOption: true, skipNoResults: true }));
      await page.getByRole('combobox', { name: 'Fruit' }).fill('Mango');
      await page.getByRole('option', { name: 'Add Option: Mango' }).click();
      const createdValue = await page.evaluate(() => new FormData(document.querySelector('form')).get('fruit'));
      if (createdValue !== 'Mango') throw new Error(`${name}: React option creation did not submit (${createdValue})`);
      await page.evaluate(() => window.unmountChosen());
      if (errors.length) throw new Error(`${name}: ${errors.join('; ')}`);
      console.log(`${name}: React search, keyboard, form, and accessibility checks passed`);
    } finally {
      await browser.close();
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
