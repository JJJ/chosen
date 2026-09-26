/* Run the existing Jasmine suites in an installed Chrome browser. */
const path = require('node:path');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const fixture = (name) => path.join(root, name);
const suites = [
  {
    name: 'jQuery 4.0.0',
    family: 'jquery',
    scripts: ['node_modules/jquery/dist/jquery.min.js', 'docs/chosen.jquery.js', 'spec/public/jquery_specs.js'],
  },
  {
    name: 'jQuery 3.5.1',
    family: 'jquery',
    scripts: ['docs/docsupport/jquery-3.5.1.min.js', 'docs/chosen.jquery.js', 'spec/public/jquery_specs.js'],
  },
  {
    name: 'jQuery 1.12.4',
    family: 'jquery',
    scripts: ['docs/docsupport/jquery-1.12.4.min.js', 'docs/chosen.jquery.js', 'spec/public/jquery_specs.js'],
  },
  {
    name: 'jQuery 1.7.2',
    family: 'jquery',
    scripts: ['docs/docsupport/jquery-1.7.2.min.js', 'docs/chosen.jquery.js', 'spec/public/jquery_specs.js'],
  },
  {
    name: 'Prototype 1.7.0',
    family: 'proto',
    scripts: [
      'docs/docsupport/prototype-1.7.0.0.js',
      'node_modules/simulant/dist/simulant.umd.js',
      'docs/chosen.proto.js',
      'spec/public/proto_specs.js',
    ],
  },
];

async function main() {
  const family = process.argv[2];
  if (family && !['jquery', 'proto'].includes(family)) {
    throw new Error(`Unknown test family: ${family}`);
  }

  const executablePath = process.env.CHROME_EXECUTABLE_PATH;
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : { channel: 'chrome' }),
    args: ['--no-sandbox'],
    headless: true,
  });

  let failed = false;
  try {
    for (const suite of suites.filter((item) => !family || item.family === family)) {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
      try {
        await page.setContent('<!doctype html><html><head></head><body></body></html>');
        await page.addStyleTag({ path: fixture('docs/chosen.css') });
        await page.addScriptTag({ path: fixture('node_modules/jasmine-core/lib/jasmine-core/jasmine.js') });
        await page.evaluate(() => jasmine.getEnv().configure({ random: false }));
        for (const script of suite.scripts) {
          await page.addScriptTag({ path: fixture(script) });
        }
        const result = await page.evaluate(() => new Promise((resolve) => {
          let total = 0;
          const failures = [];
          jasmine.getEnv().addReporter({
            specDone(spec) {
              total += 1;
              if (spec.status === 'failed') {
                failures.push(`${spec.fullName}: ${spec.failedExpectations.map((item) => item.message).join('; ')}`);
              }
            },
            jasmineDone(run) {
              for (const failure of run.failedExpectations || []) {
                failures.push(failure.message);
              }
              resolve({ total, failures });
            },
          });
          jasmine.getEnv().execute();
        }));
        const errors = [...result.failures, ...pageErrors];
        await page.evaluate((kind) => {
          const fixture = document.createElement('div');
          fixture.id = 'accessibility-fixture';
          fixture.innerHTML = `
            <label for="single-field">Single choice</label>
            <select id="single-field" aria-describedby="single-help">
              <option value=""></option><option value="one">One</option><option value="two">Two</option>
            </select>
            <span id="single-help">Choose one option</span>
            <label for="multi-field">Multiple choices</label>
            <select id="multi-field" multiple>
              <option value="one">One</option><option value="two">Two</option>
            </select>`;
          document.body.appendChild(fixture);
          for (const select of fixture.querySelectorAll('select')) {
            if (kind === 'jquery') window.jQuery(select).chosen();
            else new window.Chosen(select);
          }
        }, suite.family);
        await page.addScriptTag({ path: fixture('node_modules/axe-core/axe.min.js') });
        const violations = await page.evaluate(async () => {
          const report = await axe.run(document.querySelector('#accessibility-fixture'), {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          });
          return report.violations.map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(', ')}`);
        });
        errors.push(...violations.map((item) => `Accessibility: ${item}`));
        const singleControl = page.locator('#accessibility-fixture .chosen-container-single .chosen-single');
        const singleComboboxes = page.getByRole('combobox', { name: 'Single choice' });
        if (await singleComboboxes.count() !== 1) {
          errors.push(`Accessibility: Closed single select exposed ${await singleComboboxes.count()} named comboboxes`);
        }
        await singleControl.focus();
        if (await singleControl.evaluate((element) => getComputedStyle(element).outlineStyle) === 'none') {
          errors.push('Accessibility: Single select has no visible focus outline');
        }
        await page.keyboard.press('Enter');
        if (await singleComboboxes.count() !== 1) {
          errors.push(`Accessibility: Open single select exposed ${await singleComboboxes.count()} named comboboxes`);
        }
        if (await singleControl.getAttribute('aria-expanded') !== 'true') {
          const state = await page.evaluate(() => ({
            focus: document.activeElement?.outerHTML.slice(0, 160),
            control: document.querySelector('#accessibility-fixture .chosen-single')?.outerHTML.slice(0, 160),
          }));
          errors.push(`Keyboard: Enter did not open the single select (${JSON.stringify(state)})`);
        }
        const resultsStatus = page.locator('#accessibility-fixture .chosen-container-single .chosen-results-status');
        if (await resultsStatus.textContent() !== '2 results available') {
          errors.push(`Accessibility: Result count was not announced (${JSON.stringify(await resultsStatus.textContent())})`);
        }
        const compositionState = await page.evaluate(async () => {
          const input = document.querySelector('#accessibility-fixture .chosen-container-single .chosen-search-input');
          const select = document.querySelector('#single-field');
          input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
          input.value = 'Two';
          input.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'Two', inputType: 'insertCompositionText' }));
          const during = document.querySelectorAll('#accessibility-fixture .chosen-container-single .active-result').length;
          input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'Two' }));
          for (const type of ['keydown', 'keyup']) {
            const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' });
            Object.defineProperty(event, 'which', { value: 13 });
            input.dispatchEvent(event);
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
          return {
            during,
            after: document.querySelectorAll('#accessibility-fixture .chosen-container-single .active-result').length,
            value: select.value,
          };
        });
        if (compositionState.during !== 2 || compositionState.after !== 1 || compositionState.value !== '') {
          errors.push(`IME: Composition filtered or selected stale input (${JSON.stringify(compositionState)})`);
        }
        await page.keyboard.press('Escape');
        if (await singleControl.getAttribute('aria-expanded') !== 'false') {
          errors.push('Keyboard: Escape did not close the single select');
        }
        if (await singleControl.evaluate((element) => document.activeElement === element) !== true) {
          errors.push('Keyboard: Escape did not return focus to the single select');
        }
        if (await resultsStatus.textContent() !== '') {
          errors.push('Accessibility: Result count was not cleared when the single select closed');
        }
        const multiSearch = page.locator('#accessibility-fixture .chosen-container-multi .chosen-search-input');
        await multiSearch.focus();
        const multiOutline = await multiSearch.evaluate((element) => getComputedStyle(element.closest('.chosen-choices')).outlineStyle);
        if (multiOutline === 'none') {
          errors.push('Accessibility: Multiple select has no visible focus outline');
        }
        await page.evaluate((kind) => {
          const select = document.querySelector('#multi-field');
          for (let index = 3; index <= 40; index += 1) {
            select.add(new Option(`Option ${index}`, String(index)));
          }
          if (kind === 'jquery') {
            window.jQuery(select).trigger('chosen:updated').trigger('chosen:open');
          } else {
            select.fire('chosen:updated');
            select.fire('chosen:open');
          }
        }, suite.family);
        const multiResults = page.locator('#accessibility-fixture .chosen-container-multi .chosen-results');
        await multiResults.hover();
        await page.mouse.wheel(0, 200);
        try {
          await page.waitForFunction(() => document.querySelector('#accessibility-fixture .chosen-container-multi .chosen-results').scrollTop > 0);
        } catch {
          errors.push('Wheel: Native wheel input did not scroll the multiple-select results');
        }
        console.log(`${suite.name}: ${result.total - result.failures.length}/${result.total} specs passed`);
        for (const error of errors) console.error(`  ${error}`);
        if (errors.length || result.total === 0) failed = true;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
