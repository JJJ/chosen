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

        const searchInput = await page.evaluate((name) => {
          const select = document.createElement('select');
          select.id = 'search-input-check';
          select.style.width = '300px';
          select.multiple = true;
          select.innerHTML = '<option>One</option><option>Two</option>';
          document.body.appendChild(select);
          const chosen = name === 'jQuery'
            ? window.jQuery(select).chosen().data('chosen')
            : new window.Chosen(select);
          return (chosen.search_field[0] || chosen.search_field).outerHTML;
        }, adapter.name);
        if (!searchInput.includes('type="search"') || !searchInput.includes('autocomplete="off"')) {
          throw new Error(`${adapter.name}: default search input attributes are missing`);
        }
        const searchField = page.locator('#search_input_check_chosen .chosen-search-input');
        const appearance = await searchField.evaluate((input) => getComputedStyle(input).appearance);
        if (appearance !== 'none') {
          throw new Error(`${adapter.name}: native search styling was not suppressed (${appearance})`);
        }
        await searchField.fill('Two');
        if (await page.locator('#search_input_check_chosen .active-result').count() !== 1) {
          throw new Error(`${adapter.name}: default search input did not filter results`);
        }
        console.log(`${adapter.name}: iPad WebKit search input styling and filtering passed`);

        await page.evaluate((name) => {
          const select = document.createElement('select');
          select.id = 'limited-choices';
          select.style.width = '300px';
          select.multiple = true;
          select.innerHTML = '<option selected>One</option><option selected>Two</option><option selected>Three</option>';
          document.body.appendChild(select);
          if (name === 'jQuery') window.jQuery(select).chosen({ max_items_shown: 1 });
          else new window.Chosen(select, { max_items_shown: 1 });
        }, adapter.name);
        const summary = page.locator('#limited_choices_chosen .chosen-choice-summary button');
        if (await summary.textContent() !== 'Show 2 more...') {
          throw new Error(`${adapter.name}: collapsed summary text is incorrect`);
        }
        if (await page.locator('#limited_choices_chosen .search-choice:visible').count() !== 1) {
          throw new Error(`${adapter.name}: collapsed choices did not hide the excess chips`);
        }
        await summary.tap();
        if (await summary.textContent() !== 'Show fewer...') {
          throw new Error(`${adapter.name}: expanded summary text is incorrect`);
        }
        if (await page.locator('#limited_choices_chosen .search-choice:visible').count() !== 3) {
          throw new Error(`${adapter.name}: tapping the summary did not reveal the selected chips`);
        }
        await summary.tap();
        if (await page.locator('#limited_choices_chosen .search-choice:visible').count() !== 1) {
          throw new Error(`${adapter.name}: tapping Show fewer did not collapse the selected chips`);
        }
        if (errors.length) throw new Error(`${adapter.name}: ${errors.join('; ')}`);
        console.log(`${adapter.name}: iPad WebKit selected-choice summary passed`);

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

      const phoneContext = await browser.newContext(devices['iPhone SE']);
      try {
        const phonePage = await phoneContext.newPage();
        phonePage.setDefaultTimeout(5000);
        const phoneErrors = [];
        phonePage.on('pageerror', (error) => phoneErrors.push(error.message));
        await phonePage.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
          <select id="phone-choice" style="width:300px"><option value="">Choose</option><option value="one">One</option><option value="two">Two</option></select>
          <select id="phone-multiple" style="width:300px" multiple><option>One</option><option>Two</option></select>
        </body></html>`);
        await phonePage.addStyleTag({ path: fixture('docs/chosen.css') });
        await phonePage.addScriptTag({ path: fixture(adapter.library) });
        await phonePage.addScriptTag({ path: fixture(adapter.chosen) });
        await phonePage.evaluate((name) => {
          for (const select of document.querySelectorAll('select')) {
            if (name === 'jQuery') window.jQuery(select).chosen();
            else new window.Chosen(select);
          }
        }, adapter.name);
        const phoneInputSizes = await phonePage.evaluate(() => [
          document.querySelector('#phone_choice_chosen .chosen-search-input'),
          document.querySelector('#phone_multiple_chosen .chosen-search-input'),
        ].map((input) => parseFloat(getComputedStyle(input).fontSize)));
        if (phoneInputSizes.some((size) => size < 16)) {
          throw new Error(`${adapter.name}: phone search input font sizes ${phoneInputSizes.join(', ')}px`);
        }
        await phonePage.locator('#phone_choice_chosen .chosen-single').tap();
        if (!await phonePage.locator('#phone_choice_chosen').evaluate((container) => container.classList.contains('chosen-with-drop'))) {
          throw new Error(`${adapter.name}: phone tap closed the single-select dropdown`);
        }
        await phonePage.locator('#phone_choice_chosen .chosen-search-input').fill('Two');
        await phonePage.locator('#phone_choice_chosen .active-result').tap();
        if (await phonePage.locator('#phone-choice').inputValue() !== 'two') {
          throw new Error(`${adapter.name}: phone tap did not select the filtered result`);
        }
        if (phoneErrors.length) throw new Error(`${adapter.name}: ${phoneErrors.join('; ')}`);
        console.log(`${adapter.name}: iPhone WebKit single-select tap, filter, and select passed`);
      } finally {
        await phoneContext.close();
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
