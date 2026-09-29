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
    const suiteControlWidth = await page.locator('#standard-select .chosen-native').evaluate(node => node.getBoundingClientRect().width);
    if (suiteControlWidth < 300) throw new Error(`${name}: standard example control clipped at ${suiteControlWidth}px`);
    const currentNav = await page.locator('.site-nav [aria-current="page"]').allTextContents();
    if (JSON.stringify(currentNav) !== '["Vanilla demo"]') throw new Error(`${name}: wrong active demo navigation`);
    for (const href of ['#native-single-example', '#native-multiple-example', '#native-season-example']) {
      if (!await page.locator(`.demo-quick-tests a[href="${href}"]`).count() ||
        !await page.locator(href).count()) throw new Error(`${name}: broken quick-test link ${href}`);
    }
    const quickSkills = page.getByRole('combobox', { name: 'Skills' });
    await quickSkills.fill('zzzz');
    if (!await page.getByRole('option', { name: 'Other' }).count()) {
      throw new Error(`${name}: pinned option missing in quick test`);
    }
    await quickSkills.fill('New skill');
    await quickSkills.press('Enter');
    if (JSON.stringify(await page.evaluate(() => new FormData(document.querySelector('#native-demo-form')).getAll('skills'))) !== '["New skill"]') {
      throw new Error(`${name}: quick-test Enter did not create the new skill`);
    }
    await page.reload();
    const project = page.getByRole('combobox', { name: 'Project' });
    await project.click();
    await project.fill('bea');
    if (await page.getByRole('option', { name: 'Atlas' }).count()) throw new Error(`${name}: single search failed`);
    await page.getByRole('option', { name: 'Beacon' }).click();
    const selected = await page.evaluate(() => new FormData(document.querySelector('#native-demo-form')).get('project'));
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
    await page.getByText('Skills', { exact: true }).click();
    if (await skills.getAttribute('aria-expanded') !== 'true') {
      throw new Error(`${name}: multiple label did not open the results`);
    }
    await skills.fill('jav');
    await skills.press('Enter');
    const values = await page.evaluate(() => new FormData(document.querySelector('#native-demo-form')).getAll('skills'));
    if (JSON.stringify(values) !== '["javascript"]') throw new Error(`${name}: multiple keyboard selection failed`);
    const resultStyle = await page.evaluate(() => {
      const host = document.querySelector('#native-skills').nextElementSibling;
      const group = host.querySelector('.chosen-native__group-label');
      const row = host.querySelector('.chosen-native__option--selected');
      const chipRemove = host.querySelector('.chosen-native__remove');
      return {
        selected: row?.getAttribute('aria-selected'),
        mark: getComputedStyle(row, '::after').content,
        indent: parseFloat(getComputedStyle(row).paddingInlineStart) - parseFloat(getComputedStyle(group).paddingInlineStart),
        removePadding: parseFloat(getComputedStyle(chipRemove).paddingLeft)
      };
    });
    if (resultStyle.selected !== 'true' || !resultStyle.mark.includes('×') ||
        resultStyle.indent < 4 || resultStyle.removePadding !== 0) {
      throw new Error(`${name}: selected/group/chip styling failed (${JSON.stringify(resultStyle)})`);
    }
    await page.getByRole('option', { name: 'JavaScript' }).click();
    if ((await page.evaluate(() => new FormData(document.querySelector('#native-demo-form')).getAll('skills'))).length) {
      throw new Error(`${name}: selected result click did not remove the option`);
    }
    await page.getByRole('option', { name: 'JavaScript' }).click();
    await page.getByRole('button', { name: 'Remove JavaScript' }).click();
    if ((await page.evaluate(() => new FormData(document.querySelector('#native-demo-form')).getAll('skills'))).length) {
      throw new Error(`${name}: chip removal failed`);
    }
    await skills.fill('typ');
    await skills.press('Tab');
    const tabSelection = await page.evaluate(() => ({
      values: new FormData(document.querySelector('#native-demo-form')).getAll('skills'),
      focus: document.activeElement?.id
    }));
    if (JSON.stringify(tabSelection.values) !== '["typography"]' || tabSelection.focus !== 'native-season-native') {
      throw new Error(`${name}: opt-in Tab selection or focus navigation failed (${JSON.stringify(tabSelection)})`);
    }
    await skills.fill('New skill');
    await page.getByRole('option', { name: 'Add skill: New skill' }).click();
    const createdValues = await page.evaluate(() => new FormData(document.querySelector('#native-demo-form')).getAll('skills'));
    if (JSON.stringify(createdValues) !== '["typography","New skill"]') {
      throw new Error(`${name}: native option creation did not submit (${JSON.stringify(createdValues)})`);
    }
    await page.getByRole('button', { name: 'Use right-to-left skills' }).click();
    const direction = await skills.evaluate(node => getComputedStyle(node).direction);
    if (direction !== 'rtl') throw new Error(`${name}: source direction was not copied to the control`);
    await page.getByRole('button', { name: 'Use left-to-right skills' }).click();
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
      return document.querySelector('#native-project').nextElementSibling.querySelector('.chosen-native__value').textContent;
    });
    if (external !== 'Comet') throw new Error(`${name}: external change did not synchronize`);
    await page.getByRole('button', { name: 'Reset form' }).click();
    await page.waitForFunction(() => document.querySelector('#native-project').value === '');
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 0)));
    await project.fill('ops-42');
    if (!await page.getByRole('option', { name: 'Operations' }).count()) {
      throw new Error(`${name}: demo value search failed`);
    }
    await project.press('Escape');
    const season = page.getByRole('combobox', { name: 'Season' });
    const seasonStyle = await season.evaluate(input => ({ readOnly: input.readOnly,
      autocomplete: input.getAttribute('aria-autocomplete'), opacity: getComputedStyle(input).opacity }));
    if (!seasonStyle.readOnly || seasonStyle.autocomplete !== 'none' || seasonStyle.opacity !== '0') {
      throw new Error(`${name}: search-free input styling failed (${JSON.stringify(seasonStyle)})`);
    }
    await season.click();
    const seasonLayout = await page.evaluate(() => {
      const host = document.querySelector('#native-season').nextElementSibling;
      const control = host.querySelector('.chosen-native__control').getBoundingClientRect();
      const popup = host.querySelector('.chosen-native__popup');
      const rect = popup.getBoundingClientRect();
      return { position: getComputedStyle(popup).position, controlWidth: control.width,
        popupWidth: rect.width, aligned: Math.abs(rect.left - control.left) < 2 };
    });
    if (seasonLayout.position !== 'fixed' || seasonLayout.popupWidth <= seasonLayout.controlWidth || !seasonLayout.aligned) {
      throw new Error(`${name}: fixed wider dropdown layout failed (${JSON.stringify(seasonLayout)})`);
    }
    await page.evaluate(() => { document.body.style.minHeight = '300vh'; window.scrollBy(0, 60); });
    await page.waitForFunction(() => {
      const host = document.querySelector('#native-season').nextElementSibling;
      const control = host.querySelector('.chosen-native__control').getBoundingClientRect();
      const popup = host.querySelector('.chosen-native__popup').getBoundingClientRect();
      return Math.min(Math.abs(popup.top - control.bottom), Math.abs(popup.bottom - control.top)) < 3;
    }, null, { timeout: 1000 });
    const scrolledLayout = await page.evaluate(() => {
      const host = document.querySelector('#native-season').nextElementSibling;
      const control = host.querySelector('.chosen-native__control').getBoundingClientRect();
      const popup = host.querySelector('.chosen-native__popup').getBoundingClientRect();
      const node = host.querySelector('.chosen-native__popup');
      return { controlBottom: control.bottom, controlTop: control.top,
        popupTop: popup.top, popupBottom: popup.bottom,
        styleTop: node.style.top, styleBottom: node.style.bottom,
        offsetHeight: node.offsetHeight, marginTop: getComputedStyle(node).marginTop,
        innerHeight: window.innerHeight, clientHeight: document.documentElement.clientHeight,
        visualHeight: visualViewport.height };
    });
    if (Math.min(Math.abs(scrolledLayout.popupTop - scrolledLayout.controlBottom),
      Math.abs(scrolledLayout.popupBottom - scrolledLayout.controlTop)) > 3) {
      throw new Error(`${name}: fixed dropdown did not follow page scroll (${JSON.stringify(scrolledLayout)})`);
    }
    await season.press('w');
    if (await season.getAttribute('aria-activedescendant') !== 'native-season-native-option-4') {
      throw new Error(`${name}: search-free prefix navigation failed`);
    }
    await season.press('Enter');
    if (await page.evaluate(() => document.querySelector('#native-season').value) !== 'winter') {
      throw new Error(`${name}: search-free selection failed`);
    }
    if (errors.length) throw new Error(`${name}: ${errors.join('; ')}`);
    if (name === 'Chromium') {
      await page.addScriptTag({ path: path.join(__dirname, '..', 'node_modules/axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('main'))).violations);
      if (violations.length) throw new Error(`${name}: accessibility violations: ${violations.map(v => `${v.id}: ${v.nodes.map(node => node.target.join(' ')).join(', ')}`).join('; ')}`);
    }
    if (name === 'WebKit') {
      const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
      await touch.goto(demo);
      const input = touch.getByRole('combobox', { name: 'Project' });
      await input.tap();
      await touch.getByRole('option', { name: 'Atlas' }).tap();
      const mobile = await touch.evaluate(() => ({
        value: document.querySelector('#native-project').value,
        fontSize: parseFloat(getComputedStyle(document.querySelector('#native-project').nextElementSibling.querySelector('.chosen-native__input')).fontSize),
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
