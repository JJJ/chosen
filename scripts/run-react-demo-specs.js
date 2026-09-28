const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const demo = pathToFileURL(path.join(root, 'docs/react.html')).href;
const capture = process.argv.includes('--capture');
const output = path.join(root, 'spec/visual/output');

async function main() {
  if (capture) await fs.mkdir(output, { recursive: true });
  for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) {
    const browser = await engine.launch(name === 'Chromium'
      ? { headless: true, ...(process.env.CHROME_EXECUTABLE_PATH
        ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : { channel: 'chrome' }) }
      : { headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(demo);
      const single = page.getByRole('combobox', { name: 'Favorite fruit' });
      const multiple = page.getByRole('combobox', { name: 'Fruit basket' });
      const singleControls = page.getByRole('group', { name: 'Single select examples' });
      const basketControls = page.getByRole('group', { name: 'Multiple select examples' });
      const checkLabelMouseDown = async (input, labelFor, placeholder) => {
        const bounds = await page.locator(`label[for="${labelFor}"]`).boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        const expanded = await input.getAttribute('aria-expanded');
        const currentPlaceholder = await input.getAttribute('placeholder');
        await page.mouse.up();
        if (expanded !== 'true' || currentPlaceholder !== placeholder) {
          throw new Error(`${name}: mouse down on ${labelFor} closed its dropdown or changed its placeholder`);
        }
      };
      const checkChevron = async (selector, direction) => {
        const style = await page.locator(`${selector} .chosen-react__chevron`).evaluate(icon => {
          const computed = getComputedStyle(icon);
          return { right: computed.borderRightWidth, left: computed.borderLeftWidth,
            bottom: computed.borderBottomWidth, direction: computed.direction,
            angle: Math.round(Math.atan2(new DOMMatrix(computed.transform).b,
              new DOMMatrix(computed.transform).a) * 180 / Math.PI) };
        });
        if (style.direction !== direction || style.right !== '1px' || style.left !== '0px' ||
          style.bottom !== '1px' || style.angle !== 45) {
          throw new Error(`${name}: ${direction} chevron orientation ${JSON.stringify(style)}`);
        }
      };
      await single.waitFor();
      await multiple.waitFor();
      await checkChevron('.react-demo-card:first-child', 'ltr');
      await checkChevron('.react-demo-tailwind', 'ltr');
      const checkGroupIndent = async direction => {
        await page.locator('.react-demo-tailwind .chosen-react__list').waitFor();
        const spacing = await page.evaluate(() => {
          const list = document.querySelector('.react-demo-tailwind .chosen-react__list');
          const plain = [...list.querySelectorAll('.chosen-react__option')].find(option => option.textContent === 'Apple');
          const grouped = [...list.querySelectorAll('[role="group"] > .chosen-react__option')]
            .find(option => option.textContent === 'Orange');
          return { plain: parseFloat(getComputedStyle(plain).paddingInlineStart),
            grouped: parseFloat(getComputedStyle(grouped).paddingInlineStart),
            direction: getComputedStyle(grouped).direction };
        });
        if (spacing.direction !== direction || spacing.grouped < spacing.plain + 8) {
          throw new Error(`${name}: grouped option indentation ${JSON.stringify(spacing)}`);
        }
      };
      await multiple.click();
      await checkLabelMouseDown(multiple, 'react-basket', 'Search fruit');
      await checkGroupIndent('ltr');
      const orange = page.getByRole('option', { name: 'Orange' });
      await orange.hover();
      await page.waitForFunction(() => document.querySelector('.react-demo-tailwind .chosen-react__option--active')?.textContent === 'Orange');
      const resultState = await page.evaluate(() => {
        const host = document.querySelector('.react-demo-tailwind .chosen-react');
        const apple = [...host.querySelectorAll('.chosen-react__option')].find(option => option.textContent === 'Apple');
        const orange = [...host.querySelectorAll('.chosen-react__option')].find(option => option.textContent === 'Orange');
        const popup = host.querySelector('.chosen-react__popup');
        return { activeCount: host.querySelectorAll('.chosen-react__option--active').length,
          appleSelected: apple.classList.contains('chosen-react__option--selected'),
          appleActive: apple.classList.contains('chosen-react__option--active'),
          appleBackground: getComputedStyle(apple).backgroundColor,
          check: getComputedStyle(apple, '::after').content,
          orangeActive: orange.classList.contains('chosen-react__option--active'),
          descendant: host.querySelector('[role="combobox"]').getAttribute('aria-activedescendant'),
          orangeId: orange.id, overflow: getComputedStyle(popup).overflow };
      });
      if (resultState.activeCount !== 1 || !resultState.appleSelected || resultState.appleActive ||
        !resultState.orangeActive || resultState.descendant !== resultState.orangeId ||
        resultState.appleBackground !== 'rgb(238, 242, 255)' || !resultState.check.includes('×') ||
        resultState.overflow !== 'hidden') {
        throw new Error(`${name}: selected, hover, or dropdown clipping state ${JSON.stringify(resultState)}`);
      }
      const removeButton = page.getByRole('button', { name: 'Remove Apple' });
      const removeStyle = await removeButton.evaluate(button => {
        const style = getComputedStyle(button);
        const chip = button.closest('.chosen-react__chip');
        return { width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height,
          padding: style.padding, endGap: chip.getBoundingClientRect().right - button.getBoundingClientRect().right,
          chipEndPadding: parseFloat(getComputedStyle(chip).paddingInlineEnd) };
      });
      if (removeStyle.width >= 20 || removeStyle.height < 20 || removeStyle.padding !== '0px' ||
        Math.abs(removeStyle.endGap - removeStyle.chipEndPadding) > 1) {
        throw new Error(`${name}: chip remove spacing ${JSON.stringify(removeStyle)}`);
      }
      const appleResult = page.getByRole('option', { name: 'Apple' });
      await appleResult.click();
      if (await appleResult.getAttribute('aria-selected') !== 'false' || await removeButton.count() !== 0 ||
        (await page.locator('select[name="basket"]').evaluate(select => [...select.selectedOptions].map(option => option.value))).includes('apple')) {
        throw new Error(`${name}: clicking a selected result did not remove its native selection`);
      }
      await appleResult.click();
      if (await appleResult.getAttribute('aria-selected') !== 'true' || await removeButton.count() !== 1) {
        throw new Error(`${name}: clicking an unselected result did not restore its chip`);
      }
      if (capture && name === 'Chromium') {
        await page.screenshot({ path: path.join(output, 'react-demo-hover-ltr.png'), fullPage: true });
      }
      await multiple.press('Escape');
      await multiple.click();
      await page.locator('label[for="react-fruit"]').click();
      if (await multiple.getAttribute('aria-expanded') !== 'false' ||
        await single.getAttribute('aria-expanded') !== 'true') {
        throw new Error(`${name}: clicking a different select label did not transfer the open dropdown`);
      }
      await checkLabelMouseDown(single, 'react-fruit', 'Choose a fruit');
      await single.press('Escape');
      await page.locator('label[for="react-fruit"]').click();
      if (await single.getAttribute('aria-expanded') !== 'true') {
        throw new Error(`${name}: clicking the single select label did not open its dropdown`);
      }
      await single.press('Escape');
      await single.fill('orchard-42');
      if (!await page.getByRole('option', { name: 'Orchard' }).count()) {
        throw new Error(`${name}: React demo value search failed`);
      }
      await single.press('Escape');
      if (name === 'Chromium') await page.addScriptTag({ url: pathToFileURL(path.join(root, 'node_modules/axe-core/axe.min.js')).href });
      const audit = async theme => {
        if (name !== 'Chromium') return;
        const violations = await page.evaluate(async () => (await axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        })).violations.map(item => `${item.id}: ${item.nodes.map(node =>
          `${node.target.join(' ')} (${node.failureSummary})`).join(', ')}`));
        if (violations.length) throw new Error(`${name}: ${theme} accessibility ${violations.join('; ')}`);
      };
      await audit('light');
      if (capture && name === 'Chromium') {
        const desktop = await browser.newPage({ viewport: { width: 1200, height: 850 } });
        await desktop.goto(demo);
        await desktop.getByRole('combobox', { name: 'Fruit basket' }).waitFor();
        await desktop.screenshot({ path: path.join(output, 'react-demo-desktop-light.png'), fullPage: true });
        await desktop.locator('.react-demo-grid').screenshot({ path: path.join(output, 'react-demo-controls-light.png') });
        await desktop.close();
      }

      await page.getByRole('button', { name: 'Submit form' }).click();
      if (await single.getAttribute('aria-invalid') !== 'true') throw new Error(`${name}: required state not shown`);
      await single.click();
      await page.getByRole('option', { name: 'Banana' }).first().click();
      await multiple.click();
      await page.getByRole('option', { name: 'Orange' }).click();
      await multiple.press('Escape');
      const values = await page.evaluate(() => {
        const form = document.querySelector('#react-example-form');
        const data = new FormData(form);
        return { fruit: data.get('fruit'), basket: data.getAll('basket') };
      });
      if (values.fruit !== 'banana' || JSON.stringify(values.basket) !== '["apple","orange"]') {
        throw new Error(`${name}: native form values ${JSON.stringify(values)}`);
      }
      await page.getByRole('button', { name: 'Submit form' }).click();
      if (!(await page.locator('.react-demo-actions output[role="status"]').textContent()).includes('fruit=banana')) {
        throw new Error(`${name}: form result missing`);
      }

      await basketControls.getByRole('checkbox', { name: 'Right-to-left' }).check();
      if (await page.locator('.react-demo-tailwind .chosen-react').getAttribute('dir') !== 'rtl') {
        throw new Error(`${name}: right-to-left direction missing`);
      }
      await checkChevron('.react-demo-tailwind', 'rtl');
      if (await page.locator('.react-demo-card').first().locator('.chosen-react').getAttribute('dir') === 'rtl') {
        throw new Error(`${name}: basket direction changed the single select`);
      }
      await multiple.click();
      await checkGroupIndent('rtl');
      if (capture && name === 'Chromium') {
        await page.screenshot({ path: path.join(output, 'react-demo-group-rtl.png'), fullPage: true });
      }
      await multiple.press('Escape');
      await page.getByRole('button', { name: 'Use dark color scheme' }).click();
      if (await page.locator('html').getAttribute('data-theme') !== 'dark') {
        throw new Error(`${name}: dark theme did not activate`);
      }
      await audit('dark');
      await multiple.click();
      await page.getByRole('option', { name: 'Orange' }).hover();
      await audit('dark open');
      if (capture && name === 'Chromium') {
        await page.screenshot({ path: path.join(output, 'react-demo-hover-dark-rtl.png'), fullPage: true });
      }
      await multiple.press('Escape');
      if (capture && name === 'Chromium') {
        await page.screenshot({ path: path.join(output, 'react-demo-mobile-dark.png'), fullPage: true });
      }
      const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth,
        viewport: innerWidth, offenders: [...document.querySelectorAll('body *')]
          .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 6).map(element => `${element.tagName.toLowerCase()}.${element.className}`) }));
      if (overflow.width > overflow.viewport + 1) throw new Error(`${name}: mobile page overflow ${JSON.stringify(overflow)}`);

      await page.getByRole('button', { name: 'Reset' }).click();
      const reset = await page.evaluate(() => {
        const data = new FormData(document.querySelector('#react-example-form'));
        return { fruit: data.get('fruit'), basket: data.getAll('basket') };
      });
      if (reset.fruit !== '' || JSON.stringify(reset.basket) !== '["apple"]') {
        throw new Error(`${name}: reset values ${JSON.stringify(reset)}`);
      }
      await singleControls.getByRole('checkbox', { name: 'Right-to-left' }).check();
      if (await page.locator('.react-demo-card').first().locator('.chosen-react').getAttribute('dir') !== 'rtl') {
        throw new Error(`${name}: single select direction missing`);
      }
      await checkChevron('.react-demo-card:first-child', 'rtl');
      await singleControls.getByRole('checkbox', { name: 'Read-only' }).check();
      await single.click();
      if (await single.getAttribute('aria-expanded') !== 'false') {
        throw new Error(`${name}: read-only single select opened`);
      }
      await singleControls.getByRole('checkbox', { name: 'Read-only' }).uncheck();
      await singleControls.getByRole('checkbox', { name: 'Disabled' }).check();
      const disabledSingle = await page.evaluate(() => ({ disabled: document.querySelector('select[name="fruit"]').disabled,
        values: new FormData(document.querySelector('#react-example-form')).getAll('fruit') }));
      if (!disabledSingle.disabled || disabledSingle.values.length) {
        throw new Error(`${name}: disabled single select still submits ${JSON.stringify(disabledSingle)}`);
      }
      await singleControls.getByRole('checkbox', { name: 'Disabled' }).uncheck();
      await basketControls.getByRole('checkbox', { name: 'Hide selected results' }).check();
      await multiple.click();
      if (await page.getByRole('option', { name: 'Apple' }).count() !== 0) {
        throw new Error(`${name}: hidden selected result is still shown`);
      }
      await multiple.press('Escape');
      await basketControls.getByRole('checkbox', { name: 'Hide selected results' }).uncheck();
      await basketControls.getByRole('checkbox', { name: 'Hide disabled results' }).check();
      await multiple.click();
      const hiddenDisabled = await page.evaluate(() => ({
        visible: [...document.querySelectorAll('.react-demo-tailwind [role="option"]')]
          .some(option => option.textContent === 'Lemon'),
        native: [...document.querySelector('select[name="basket"]').options]
          .some(option => option.value === 'lemon' && option.disabled) }));
      if (hiddenDisabled.visible || !hiddenDisabled.native) {
        throw new Error(`${name}: disabled result filtering ${JSON.stringify(hiddenDisabled)}`);
      }
      await multiple.press('Escape');
      await basketControls.getByRole('checkbox', { name: 'Hide disabled results' }).uncheck();
      await basketControls.getByRole('checkbox', { name: 'Read-only' }).check();
      await multiple.click();
      if (await multiple.getAttribute('aria-expanded') !== 'false' || await removeButton.count() !== 0) {
        throw new Error(`${name}: read-only basket is interactive`);
      }
      await basketControls.getByRole('checkbox', { name: 'Read-only' }).uncheck();
      await basketControls.getByRole('checkbox', { name: 'Disabled', exact: true }).check();
      const disabledState = await page.evaluate(() => ({ disabled: document.querySelector('select[name="basket"]').disabled,
        values: new FormData(document.querySelector('#react-example-form')).getAll('basket') }));
      if (!disabledState.disabled || disabledState.values.length) {
        throw new Error(`${name}: disabled basket still submits ${JSON.stringify(disabledState)}`);
      }
      await basketControls.getByRole('checkbox', { name: 'Disabled', exact: true }).uncheck();
      await multiple.click();
      await page.getByRole('option', { name: 'Dragon fruit with a deliberately long option label' }).click();
      const longChip = await page.evaluate(() => {
        const chip = [...document.querySelectorAll('.react-demo-tailwind .chosen-react__chip')]
          .find(item => item.textContent.includes('Dragon fruit'));
        const control = chip.closest('.chosen-react__control');
        return { chipWidth: chip.getBoundingClientRect().width,
          controlWidth: control.getBoundingClientRect().width,
          labelOverflow: chip.querySelector('span').scrollWidth > chip.querySelector('span').clientWidth,
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      if (longChip.chipWidth > longChip.controlWidth || longChip.pageOverflow || !longChip.labelOverflow) {
        throw new Error(`${name}: long-label chip layout ${JSON.stringify(longChip)}`);
      }
      const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
      try {
        await touchPage.goto(demo);
        const phoneInputSizes = await touchPage.locator('.chosen-react__input').evaluateAll(inputs =>
          inputs.map(input => parseFloat(getComputedStyle(input).fontSize)));
        if (phoneInputSizes.some(size => size < 16)) {
          throw new Error(`${name}: React phone input font sizes ${phoneInputSizes.join(', ')}px`);
        }
        const touchBasket = touchPage.getByRole('combobox', { name: 'Fruit basket' });
        await touchBasket.tap();
        await touchPage.locator('label[for="react-basket"]').tap();
        if (await touchBasket.getAttribute('aria-expanded') !== 'true') {
          throw new Error(`${name}: tapping the basket label closed its dropdown`);
        }
      } finally { await touchPage.close(); }
      if (errors.length) throw new Error(`${name}: ${errors.join('; ')}`);
      console.log(`${name}: React demo form, theme, RTL, and mobile checks passed`);
    } finally { await browser.close(); }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
