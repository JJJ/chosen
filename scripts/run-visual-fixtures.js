/* Inspect the same named styling states in all four Chosen editions. */
const fs = require('node:fs/promises');
const path = require('node:path');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const { build } = require('esbuild');
const { chromium } = require('playwright-core');

const root = path.resolve(__dirname, '..');
const file = name => path.join(root, name);
const capture = process.argv.includes('--capture');
const output = file('spec/visual/output');
const states = ['default', 'hover', 'focus', 'open', 'disabled', 'invalid', 'drop-up'];
const editions = ['jquery', 'prototype', 'native', 'react'];
const themes = ['default', 'tailwind', 'tailwind-dark'];
const legacyFeatures = ['bulk-actions', 'bulk-filtered', 'summary', 'selected-removal',
  'single-clear', 'single-long', 'rtl-single', 'rtl-multiple'];
const reactFeatures = ['single-clear', 'single-long', 'rtl-single', 'rtl-multiple'];

function contrastRatio(first, second) {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
    if (channels?.length !== 3) throw new Error(`Unsupported visual fixture color: ${color}`);
    const [red, green, blue] = channels.map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    });
    return .2126 * red + .7152 * green + .0722 * blue;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

async function adapterGeometryFixture(page, edition, theme) {
  await page.evaluate(edition => {
    window.visualInstance?.destroy();
    window.unmountVisualChosen?.();
    const host = document.getElementById('fixture');
    host.style.width = '200px';
    host.style.padding = '16px';
    host.innerHTML = '<label for="visual-select">Narrow multiple</label><div id="mount"></div>';
    if (edition === 'react') {
      window.mountVisualChosen({ multiple: true, state: 'default', feature: 'summary' });
      return;
    }
    const select = document.createElement('select');
    select.id = 'visual-select';
    select.multiple = true;
    for (const [value, label] of [['apple', 'Apple'], ['banana', 'Banana'], ['orange', 'Orange']]) {
      select.add(new Option(label, value, true, true));
    }
    document.getElementById('mount').appendChild(select);
    window.visualInstance = new window.ChosenNative.Chosen(select, { max_items_shown: 2 });
  }, edition);
  const container = page.locator(edition === 'native' ? '#fixture .chosen-native' : '#fixture .chosen-react');
  await container.waitFor();
  const result = await container.evaluate((element, edition) => {
    const prefix = edition === 'native' ? '.chosen-native__' : '.chosen-react__';
    const chip = element.querySelector(`${prefix}chip`);
    const summary = element.querySelector(`${prefix}summary`);
    const host = document.getElementById('fixture').getBoundingClientRect();
    const box = element.getBoundingClientRect();
    return { chipHeight: chip?.getBoundingClientRect().height,
      summaryHeight: summary?.getBoundingClientRect().height,
      overflow: box.right > host.right + 1 || box.left < host.left - 1,
      innerOverflow: element.scrollWidth > element.clientWidth + 1 };
  }, edition);
  if (!result.chipHeight || !result.summaryHeight || Math.abs(result.chipHeight - result.summaryHeight) > 1
    || result.overflow || result.innerOverflow) {
    throw new Error(`${edition}/${theme}: summary or narrow layout ${JSON.stringify(result)}`);
  }
  if (capture) await page.screenshot({ path: path.join(output, `${edition}-${theme}-narrow-summary.png`),
    fullPage: true, animations: 'disabled' });
}

async function tailwindStyles() {
  const source = file('spec/fixtures/tailwind.css');
  return (await postcss([tailwindcss()]).process(await fs.readFile(source, 'utf8'), { from: source })).css;
}

async function reactBundle() {
  const result = await build({
    entryPoints: [file('spec/visual/react-entry.jsx')], write: false,
    bundle: true, format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"development"' },
  });
  return result.outputFiles[0].text;
}

async function prepare(page, edition, theme, tailwind, react) {
  const dark = theme === 'tailwind-dark';
  await page.setContent(`<!doctype html><html${dark ? ' class="dark"' : ''}><head><meta charset="utf-8"></head>
    <body><main id="fixture"></main></body></html>`);
  await page.addStyleTag({ content: `
    html { background: ${dark ? '#0b1120' : '#f5f7fa'}; }
    body { margin: 0; font: 14px Arial, sans-serif; }
    #fixture { box-sizing: border-box; width: 440px; min-height: 300px;
      margin: 48px; padding: 32px; background: ${dark ? '#0f172a' : 'white'};
      color: ${dark ? '#f1f5f9' : '#111827'}; border: 1px solid ${dark ? '#334155' : '#d5dae2'}; }
    #fixture.drop-up { margin-top: 760px; }
    #fixture label { display: block; margin-bottom: 12px; font-weight: 600; }
    #fixture .chosen-container, #fixture .chosen-native, #fixture .chosen-react { width: 100% !important; }
  ` });
  await page.addStyleTag({ path: file(edition === 'react' ? 'dist/react/chosen.css'
    : edition === 'native' ? 'dist/native/chosen.css' : 'docs/chosen.css') });
  if (theme.startsWith('tailwind')) await page.addStyleTag({ content: tailwind });
  if (dark) await page.addScriptTag({ path: file('node_modules/axe-core/axe.min.js') });
  if (edition === 'jquery') {
    await page.addScriptTag({ path: file('node_modules/jquery/dist/jquery.min.js') });
    await page.addScriptTag({ path: file('docs/chosen.jquery.js') });
  } else if (edition === 'prototype') {
    await page.addScriptTag({ path: file('docs/docsupport/prototype-1.7.0.0.js') });
    await page.addScriptTag({ path: file('node_modules/simulant/dist/simulant.umd.js') });
    await page.addScriptTag({ path: file('docs/chosen.proto.js') });
  } else if (edition === 'native') {
    await page.addScriptTag({ path: file('docs/chosen.native.js') });
  } else {
    await page.addScriptTag({ content: react });
  }
}

async function mount(page, edition, mode, state) {
  const multiple = mode === 'multiple';
  await page.evaluate(({ edition, multiple, state }) => {
    window.visualInstance?.destroy();
    window.visualInstance = null;
    window.unmountVisualChosen?.();
    const host = document.getElementById('fixture');
    host.className = state === 'drop-up' ? 'drop-up' : '';
    host.innerHTML = `<label for="visual-select">${multiple ? 'Multiple' : 'Single'} choice</label><div id="mount"></div>`;
    if (edition === 'react') {
      window.mountVisualChosen({ multiple, state });
      return;
    }
    const select = document.createElement('select');
    select.id = 'visual-select';
    select.multiple = multiple;
    select.disabled = state === 'disabled';
    select.required = state === 'invalid';
    if (state === 'invalid') select.setAttribute('aria-invalid', 'true');
    if (!multiple) select.add(new Option('Choose a fruit', '', false, state === 'invalid'));
    const group = document.createElement('optgroup');
    group.label = 'Citrus';
    for (const [value, label] of [['apple', 'Apple'], ['banana', 'Banana'], ['orange', 'Orange'], ['lemon', 'Lemon']]) {
      const option = new Option(label, value, false, state !== 'invalid' && (multiple
        ? ['apple', 'banana'].includes(value) : value === 'apple'));
      if (edition === 'native' && ['orange', 'lemon'].includes(value)) group.appendChild(option);
      else select.add(option);
    }
    if (edition === 'native') select.appendChild(group);
    document.getElementById('mount').appendChild(select);
    window.visualInstance = edition === 'native'
      ? new window.ChosenNative.Chosen(select) : edition === 'jquery'
      ? (window.jQuery(select).chosen({ width: '100%' }), window.jQuery(select).data('chosen'))
      : new window.Chosen(select, { width: '100%' });
  }, { edition, multiple, state });
  const container = page.locator(edition === 'react' ? '#fixture .chosen-react'
    : edition === 'native' ? '#fixture .chosen-native' : '#fixture .chosen-container');
  await container.waitFor();
  const control = edition === 'react' ? container.locator('.chosen-react__control')
    : edition === 'native' ? container.locator('.chosen-native__control')
      : container.locator(multiple ? '.chosen-choices' : '.chosen-single');
  if (state === 'hover' || state === 'invalid') await control.hover();
  if (state === 'focus') await (edition === 'react' ? container.locator('.chosen-react__input')
    : edition === 'native' ? container.locator('.chosen-native__input')
    : multiple ? container.locator('.chosen-search-input') : control).focus();
  if ((state === 'open' || state === 'drop-up') && edition !== 'react') {
    await page.evaluate(edition => edition === 'native' ? window.visualInstance.open()
      : window.visualInstance.results_show(), edition);
  }
  return { container, control };
}

async function verify(page, edition, theme, mode, state, { container, control }) {
  const result = await container.evaluate((element, edition) => {
    const control = element.querySelector(edition === 'react' ? '.chosen-react__control'
      : edition === 'native' ? '.chosen-native__control'
      : element.classList.contains('chosen-container-multi') ? '.chosen-choices' : '.chosen-single');
    const popup = element.querySelector(edition === 'react' ? '.chosen-react__popup'
      : edition === 'native' ? '.chosen-native__popup' : '.chosen-drop');
    const style = getComputedStyle(control);
    const box = control.getBoundingClientRect();
    return {
      width: box.width, height: box.height, border: style.borderTopColor,
      radius: style.borderTopLeftRadius,
      outline: style.outlineStyle, disabled: element.classList.contains(edition === 'react'
        ? 'chosen-react--disabled' : edition === 'native' ? 'chosen-native--disabled' : 'chosen-disabled'),
      invalid: edition === 'react' ? element.classList.contains('chosen-react--invalid')
        : edition === 'native' ? element.classList.contains('chosen-native--invalid')
        : element.previousElementSibling?.getAttribute('aria-invalid') === 'true',
      open: edition === 'react' ? !!popup : edition === 'native'
        ? element.classList.contains('chosen-native--open') : element.classList.contains('chosen-with-drop'),
      activeColors: ['native', 'react'].includes(edition) && element.querySelector(edition === 'native'
        ? '.chosen-native__option--active' : '.chosen-react__option--active')
        ? (() => { const style = getComputedStyle(element.querySelector(edition === 'native'
          ? '.chosen-native__option--active' : '.chosen-react__option--active'));
          return [style.color, style.backgroundColor]; })() : null,
      dropUp: element.classList.contains('chosen-dropup'),
      popupAbove: popup ? popup.getBoundingClientRect().bottom <= box.top + 3 : false,
    };
  }, edition);
  if (result.width < 200 || result.height < 20) throw new Error(`${edition}/${mode}/${state}: collapsed control ${JSON.stringify(result)}`);
  if (theme.startsWith('tailwind') && state !== 'drop-up' && result.radius !== '8px') {
    throw new Error(`${edition}/${mode}/${state}: Tailwind radius did not apply ${JSON.stringify(result)}`);
  }
  if (state === 'focus' && result.outline === 'none') throw new Error(`${edition}/${mode}: missing focus ring`);
  if (state === 'disabled' && !result.disabled) throw new Error(`${edition}/${mode}: disabled state missing`);
  if (state === 'invalid' && (!result.invalid || result.border !== 'rgb(220, 38, 38)')) {
    throw new Error(`${edition}/${mode}: invalid state missing ${JSON.stringify(result)}`);
  }
  if (state === 'open' && !result.open) throw new Error(`${edition}/${mode}: popup did not open`);
  if (state === 'open' && result.activeColors && contrastRatio(...result.activeColors) < 4.5) {
    throw new Error(`${edition}/${theme}/${mode}: active result text has insufficient contrast ${result.activeColors}`);
  }
  if (state === 'drop-up' && (!result.open || !result.dropUp || !result.popupAbove)) {
    throw new Error(`${edition}/${mode}: popup did not open above control ${JSON.stringify(result)}`);
  }
  if (theme === 'tailwind-dark' && state === 'open') {
    const violations = await page.evaluate(async () => (await axe.run(document.querySelector('#fixture'), {
      runOnly: ['color-contrast'],
    })).violations.map(item => `${item.id}: ${item.nodes.map(node => `${node.target.join(' ')} (${node.failureSummary})`).join(', ')}`));
    if (violations.length) throw new Error(`${edition}/${mode}: dark contrast ${violations.join('; ')}`);
  }
  if (capture) await page.screenshot({ path: path.join(output, `${edition}-${theme}-${mode}-${state}.png`), fullPage: true, animations: 'disabled' });
}

async function featureFixture(page, edition, theme, feature) {
  const multiple = ['bulk-actions', 'bulk-filtered', 'summary', 'selected-removal', 'rtl-multiple'].includes(feature);
  await page.evaluate(({ edition, feature, multiple, theme }) => {
    window.visualInstance?.destroy();
    window.visualInstance = null;
    window.unmountVisualChosen?.();
    const host = document.getElementById('fixture');
    host.className = theme === 'custom' ? 'custom' : '';
    host.innerHTML = `<label for="visual-select">Favorite ${multiple ? 'fruits' : 'fruit'}</label><div id="mount"></div>`;
    if (edition === 'react') {
      window.mountVisualChosen({ multiple, state: 'default', feature });
      return;
    }
    const select = document.createElement('select');
    select.id = 'visual-select';
    select.multiple = multiple;
    if (feature.startsWith('rtl-')) {
      select.dir = 'rtl';
      select.classList.add('chosen-rtl');
    }
    if (!multiple) select.add(new Option('', '', false, false));
    const entries = [['apple', feature === 'single-long'
      ? 'A very long selected fruit label that should stay inside a narrow control' : 'Apple'],
      ['banana', 'Banana'], ['orange', 'Orange'], ['lemon', 'Lemon'], ['pear', 'Pear']];
    for (const [value, label] of entries) {
      const selected = multiple
        ? (feature === 'summary' ? ['apple', 'banana', 'orange', 'pear'].includes(value) : value === 'apple')
        : value === 'apple';
      const option = new Option(label, value, false, selected);
      if (value === 'lemon') option.disabled = true;
      select.add(option);
    }
    document.getElementById('mount').appendChild(select);
    const options = { width: '100%', allow_select_all: feature.startsWith('bulk-'),
      allow_deselect_all: feature.startsWith('bulk-'),
      hide_results_on_select: false, max_items_shown: feature === 'summary' ? 2 : undefined,
      deselect_selected_results: feature === 'selected-removal',
      allow_single_deselect: feature === 'single-clear' };
    window.visualInstance = edition === 'jquery'
      ? (window.jQuery(select).chosen(options), window.jQuery(select).data('chosen'))
      : new window.Chosen(select, options);
    if (['bulk-actions', 'bulk-filtered', 'selected-removal', 'rtl-multiple'].includes(feature)) {
      window.visualInstance.results_show();
    }
  }, { edition, feature, multiple, theme });
  const container = page.locator(edition === 'react' ? '#fixture .chosen-react' : '#fixture .chosen-container');
  await container.waitFor();
  if (feature === 'bulk-filtered') {
    await container.locator('.chosen-search-input').fill('Banana');
  }
  const control = container.locator(edition === 'react' ? '.chosen-react__control'
    : multiple ? '.chosen-choices' : '.chosen-single');
  const result = await container.evaluate((element, { edition, feature }) => {
    const select = document.getElementById('visual-select');
    const control = element.querySelector(edition === 'react' ? '.chosen-react__control'
      : element.classList.contains('chosen-container-multi') ? '.chosen-choices' : '.chosen-single');
    const rect = control.getBoundingClientRect();
    return {
      width: rect.width, scrollWidth: control.scrollWidth, clientWidth: control.clientWidth,
      height: rect.height,
      border: getComputedStyle(control).borderTopColor,
      background: getComputedStyle(control).backgroundColor,
      direction: getComputedStyle(element).direction,
      selectDirection: select ? getComputedStyle(select).direction : '',
      selectAll: !!element.querySelector('.chosen-select-all'),
      deselectAll: !!element.querySelector('.chosen-deselect-all'),
      summary: !!element.querySelector('.chosen-choice-summary button'),
      hiddenChoices: element.querySelectorAll('.search-choice[hidden]').length,
      selectedRemoval: !!element.querySelector('.chosen-result-deselectable'),
      clear: !!element.querySelector(edition === 'react' ? '.chosen-react__clear' : '.chosen-single .search-choice-close'),
      chips: element.querySelectorAll(edition === 'react' ? '.chosen-react__chip' : '.search-choice').length,
      open: edition === 'react' ? !!element.querySelector('.chosen-react__popup') : element.classList.contains('chosen-with-drop'),
    };
  }, { edition, feature });
  const fail = message => { throw new Error(`${edition}/${theme}/${feature}: ${message} ${JSON.stringify(result)}`); };
  if (result.width < 200 || result.scrollWidth > result.clientWidth + 2) fail('control overflow');
  if (feature === 'single-long' && result.height > 55) fail('long single label wrapped');
  if (feature.startsWith('bulk-') && (!result.selectAll || !result.deselectAll || !result.open)) fail('bulk actions missing');
  if (feature === 'summary' && (!result.summary || result.hiddenChoices !== 2)) fail('collapsed summary missing');
  if (feature === 'selected-removal' && !result.selectedRemoval) fail('selected result removal missing');
  if (feature === 'single-clear' && !result.clear) fail('single clear missing');
  if (feature.startsWith('rtl-') && (result.direction !== 'rtl' || result.selectDirection !== 'rtl')) fail('RTL missing');
  if (feature === 'rtl-multiple' && (!result.open || !result.chips)) fail('RTL multiple not populated');
  if (theme === 'custom' && result.border !== 'rgb(15, 118, 110)') fail('custom palette border missing');
  if (theme === 'tailwind-dark' && ['bulk-actions', 'summary', 'single-clear', 'rtl-multiple'].includes(feature)) {
    const violations = await page.evaluate(async () => (await axe.run(document.querySelector('#fixture'), {
      runOnly: ['color-contrast'],
    })).violations.map(item => `${item.id}: ${item.nodes.map(node => `${node.target.join(' ')} (${node.failureSummary})`).join(', ')}`));
    if (violations.length) fail(`dark contrast ${violations.join('; ')}`);
  }
  if (capture) await page.screenshot({ path: path.join(output, `${edition}-${theme}-${feature}.png`), fullPage: true, animations: 'disabled' });
}

async function main() {
  if (capture) await fs.mkdir(output, { recursive: true });
  const tailwind = await tailwindStyles();
  const react = await reactBundle();
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_EXECUTABLE_PATH ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : { channel: 'chrome' }) });
  let count = 0;
  try {
    for (const edition of editions) {
      for (const theme of themes) {
        const page = await browser.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 1 });
        try {
          await prepare(page, edition, theme, tailwind, react);
          for (const mode of ['single', 'multiple']) {
            for (const state of states.filter(item => !['native', 'react'].includes(edition) || item !== 'drop-up')) {
              const fixture = await mount(page, edition, mode, state);
              await verify(page, edition, theme, mode, state, fixture);
              count += 1;
            }
          }
          for (const feature of edition === 'native' ? [] : edition === 'react' ? reactFeatures : legacyFeatures) {
            await featureFixture(page, edition, theme, feature);
            count += 1;
          }
          if (edition === 'native' || edition === 'react') {
            await adapterGeometryFixture(page, edition, theme);
            count += 1;
          }
        } finally { await page.close(); }
      }
      const page = await browser.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 1 });
      try {
        await prepare(page, edition, 'custom', tailwind, react);
        await page.addStyleTag({ content: `#fixture.custom .chosen-container, #fixture.custom .chosen-native, #fixture.custom .chosen-react {
          --chosen-border-color: #0f766e;
          --chosen-active-border-color: #0f766e;
          --chosen-text-color: #134e4a;
          --chosen-control-background: #f0fdfa;
          --chosen-focus-ring-color: #0f766e;
          --chosen-highlight-color: #0f766e;
          --chosen-highlight-background: #0f766e;
          --chosen-choice-background: #ccfbf1;
          --chosen-choice-color: #134e4a;
        }` });
        for (const feature of edition === 'native' ? []
          : ['single-clear', edition === 'react' ? 'rtl-multiple' : 'bulk-actions']) {
          await featureFixture(page, edition, 'custom', feature);
          count += 1;
        }
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
  console.log(`${count} visual fixtures passed${capture ? `; screenshots in ${output}` : ''}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
