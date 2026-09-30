/* Run the existing Jasmine suites in an installed Chrome browser. */
const path = require('node:path');
const fs = require('node:fs/promises');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const fixture = (name) => path.join(root, name);

async function buildTailwindFixture() {
  const from = fixture('spec/fixtures/tailwind.css');
  const source = await fs.readFile(from, 'utf8');
  const result = await postcss([tailwindcss()]).process(source, { from });
  return result.css;
}

async function loadCoreFixtures() {
  return JSON.parse(await fs.readFile(fixture('spec/fixtures/core-cases.json'), 'utf8'));
}

async function runCoreFilterFixtures(page, kind, cases) {
  return page.evaluate(({ kind, cases }) => {
    const errors = [];
    const optionNames = {
      displayDisabledOptions: 'display_disabled_options',
      displaySelectedOptions: 'display_selected_options',
      groupSearch: 'group_search',
      searchContains: 'search_contains',
      searchInValues: 'search_in_values',
      splitSearchTerms: 'split_search_terms',
    };

    for (const testCase of cases) {
      const wrapper = document.createElement('div');
      const select = document.createElement('select');
      select.multiple = testCase.settings.multiple;
      wrapper.appendChild(select);
      document.body.appendChild(wrapper);
      let instance;
      try {
        function addOption(parent, source) {
          const option = new Option(source.label, source.value, false, !!source.selected);
          option.disabled = !!source.disabled;
          option.hidden = !!source.hidden;
          if (source.searchText) option.setAttribute('data-search-text', source.searchText);
          parent.appendChild(option);
        }
        for (const entry of testCase.options) {
          if (entry.options) {
            const group = document.createElement('optgroup');
            group.label = entry.label;
            group.disabled = !!entry.disabled;
            group.hidden = !!entry.hidden;
            for (const child of entry.options) addOption(group, child);
            select.appendChild(group);
          } else {
            addOption(select, entry);
          }
        }
        const adapterSettings = {};
        for (const [key, legacyName] of Object.entries(optionNames)) {
          if (testCase.settings[key] !== undefined) adapterSettings[legacyName] = testCase.settings[key];
        }
        if (kind === 'jquery') {
          window.jQuery(select).chosen(adapterSettings);
          instance = window.jQuery(select).data('chosen');
        } else {
          instance = new window.Chosen(select, adapterSettings);
        }
        instance.results_show();
        wrapper.querySelector('.chosen-search-input').value = testCase.query;
        instance.winnow_results();
        const visible = Array.from(wrapper.querySelectorAll('.chosen-results > li.group-result, .chosen-results > li[data-option-array-index]'))
          .map((item) => item.textContent.trim());
        const core = window.ChosenCore.filterOptions(testCase.options, testCase.query, testCase.settings)
          .items.map((item) => item.label);
        if (JSON.stringify(visible) !== JSON.stringify(testCase.expected) || JSON.stringify(core) !== JSON.stringify(testCase.expected)) {
          errors.push(`Core parity: ${testCase.name} (${JSON.stringify({ visible, core, expected: testCase.expected })})`);
        }
      } catch (error) {
        errors.push(`Core parity: ${testCase.name} (${error.message})`);
      } finally {
        if (instance) instance.destroy();
        wrapper.remove();
      }
    }
    return errors;
  }, { kind, cases });
}

async function runCoreSelectionFixtures(page, kind, cases) {
  return page.evaluate(({ kind, cases }) => {
    const errors = [];
    for (const testCase of cases) {
      const wrapper = document.createElement('div');
      const select = document.createElement('select');
      select.multiple = testCase.settings.multiple;
      wrapper.appendChild(select);
      document.body.appendChild(wrapper);
      let instance;
      try {
        const names = testCase.initial.slice();
        for (const step of testCase.steps) {
          if (!names.includes(step.option.value)) names.push(step.option.value);
        }
        for (const name of names) {
          const option = new Option(name, name, false, testCase.initial.includes(name));
          option.disabled = testCase.steps.some((step) => step.option.value === name && step.option.disabled);
          select.appendChild(option);
        }
        const settings = {
          max_selected_options: testCase.settings.maxSelectedOptions,
          deselect_selected_results: true,
          hide_results_on_select: false,
        };
        if (kind === 'jquery') {
          window.jQuery(select).chosen(settings);
          instance = window.jQuery(select).data('chosen');
        } else {
          instance = new window.Chosen(select, settings);
        }
        for (const step of testCase.steps) {
          instance.results_show();
          const result = Array.from(wrapper.querySelectorAll('.chosen-results > li[data-value]'))
            .find((item) => item.getAttribute('data-value') === step.option.value);
          if (result) result.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
          const actual = Array.from(select.selectedOptions).map((item) => item.value);
          if (JSON.stringify(actual) !== JSON.stringify(step.expected)) {
            errors.push(`Core selection parity: ${testCase.name} after ${step.action || 'select'} ${step.option.value} (${JSON.stringify({ actual, expected: step.expected })})`);
          }
        }
      } catch (error) {
        errors.push(`Core selection parity: ${testCase.name} (${error.message})`);
      } finally {
        if (instance) instance.destroy();
        wrapper.remove();
      }
    }
    return errors;
  }, { kind, cases });
}
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
  const tailwindFixture = await buildTailwindFixture();
  const coreFixtures = await loadCoreFixtures();
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
        errors.push(...await runCoreFilterFixtures(page, suite.family, coreFixtures.filterCases));
        errors.push(...await runCoreSelectionFixtures(page, suite.family, coreFixtures.selectionCases));
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
        const openSingleStyles = await singleControl.evaluate((element) => ({
          borderColor: getComputedStyle(element).borderColor,
          outlineStyle: getComputedStyle(element).outlineStyle,
        }));
        if (openSingleStyles.outlineStyle !== 'none' || openSingleStyles.borderColor !== 'rgb(88, 151, 251)') {
          errors.push(`Accessibility: Open single select did not use only the joined active border (${JSON.stringify(openSingleStyles)})`);
        }
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
        const openMultiStyles = await multiSearch.evaluate((element) => {
          const choices = element.closest('.chosen-choices');
          const drop = element.closest('.chosen-container').querySelector('.chosen-drop');
          return {
            choicesBorderColor: getComputedStyle(choices).borderColor,
            dropBorderColor: getComputedStyle(drop).borderColor,
            outlineStyle: getComputedStyle(choices).outlineStyle,
          };
        });
        if (openMultiStyles.outlineStyle !== 'none' || openMultiStyles.choicesBorderColor !== 'rgb(88, 151, 251)' || openMultiStyles.dropBorderColor !== 'rgb(88, 151, 251)') {
          errors.push(`Accessibility: Open multiple select did not use only the joined active border (${JSON.stringify(openMultiStyles)})`);
        }
        const multiResults = page.locator('#accessibility-fixture .chosen-container-multi .chosen-results');
        await multiResults.hover();
        await page.mouse.wheel(0, 200);
        try {
          await page.waitForFunction(() => document.querySelector('#accessibility-fixture .chosen-container-multi .chosen-results').scrollTop > 0);
        } catch {
          errors.push('Wheel: Native wheel input did not scroll the multiple-select results');
        }
        await page.addStyleTag({ content: tailwindFixture });
        const tailwindStyles = await singleControl.evaluate((element) => {
          const container = element.closest('.chosen-container');
          const dropdown = container.querySelector('.chosen-drop');
          const search = container.querySelector('.chosen-search-input');
          const probe = document.createElement('div');
          probe.style.cssText = 'position:absolute;border-radius:var(--radius-lg);padding-top:calc(var(--spacing) * 2);font-size:var(--text-sm)';
          document.body.appendChild(probe);
          const probeStyles = getComputedStyle(probe);
          const expected = {
            borderRadius: probeStyles.borderRadius,
            fontSize: probeStyles.fontSize,
            searchPaddingTop: probeStyles.paddingTop,
          };
          probe.remove();
          return {
            borderRadius: getComputedStyle(element).borderRadius,
            controlShadow: getComputedStyle(element).boxShadow,
            dropdownShadow: getComputedStyle(dropdown).boxShadow,
            fontSize: getComputedStyle(container).fontSize,
            searchPaddingTop: getComputedStyle(search).paddingTop,
            expected,
          };
        });
        if (tailwindStyles.borderRadius !== tailwindStyles.expected.borderRadius || tailwindStyles.controlShadow === 'none' || tailwindStyles.dropdownShadow === 'none' || tailwindStyles.fontSize !== tailwindStyles.expected.fontSize || tailwindStyles.searchPaddingTop !== tailwindStyles.expected.searchPaddingTop) {
          errors.push(`Tailwind: Theme variables or forms reset did not integrate cleanly (${JSON.stringify(tailwindStyles)})`);
        }
        const darkStyles = await singleControl.evaluate((element) => {
          document.documentElement.classList.add('dark');
          try {
            const container = element.closest('.chosen-container');
            const dropdown = container.querySelector('.chosen-drop');
            return {
              colorScheme: getComputedStyle(container).colorScheme,
              controlBackground: getComputedStyle(element).backgroundColor,
              dropdownBackground: getComputedStyle(dropdown).backgroundColor,
            };
          } finally {
            document.documentElement.classList.remove('dark');
          }
        });
        if (darkStyles.colorScheme !== 'dark' || darkStyles.controlBackground === 'rgb(255, 255, 255)' || darkStyles.controlBackground === darkStyles.dropdownBackground) {
          errors.push(`Tailwind: Dark theme surfaces did not apply (${JSON.stringify(darkStyles)})`);
        }
        await page.evaluate((kind) => {
          const wrapper = document.createElement('div');
          wrapper.id = 'secondary-button-fixture';
          wrapper.innerHTML = '<select><option>One</option><option>Two</option></select><select multiple><option>One</option><option>Two</option></select>';
          document.body.appendChild(wrapper);
          for (const select of wrapper.querySelectorAll('select')) {
            if (kind === 'jquery') window.jQuery(select).chosen();
            else new window.Chosen(select);
          }
        }, suite.family);
        for (const control of [page.locator('#secondary-button-fixture .chosen-single'), page.locator('#secondary-button-fixture .chosen-choices')]) {
          await control.click({ button: 'right' });
          if (await page.locator('#secondary-button-fixture .chosen-with-drop').count()) {
            errors.push('Secondary-button click opened a closed Chosen control');
          }
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
