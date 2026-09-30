import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { Chosen } from '../../native/Chosen.mjs';

function fixture(markup) {
  const dom = new JSDOM(`<form id="form">${markup}<button id="after">After</button></form>`, { url: 'http://localhost/' });
  for (const name of ['window', 'document', 'HTMLSelectElement', 'CustomEvent', 'Event']) {
    globalThis[name] = name === 'window' ? dom.window : dom.window[name];
  }
  const select = document.querySelector('select');
  return { dom, select, form: document.querySelector('form') };
}

function key(input, name, modifiers = {}) {
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...modifiers }));
}

function click(node) {
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

test('label-only options remain searchable and submit their native values', () => {
  const { dom, select, form } = fixture('<select name="fruit"><option value=""></option><option value="a" label="Apple &amp; Pear"></option><optgroup label="Citrus"><option value="o" label="Orange"></option></optgroup></select>');
  const chosen = new Chosen(select);
  chosen.open();
  assert.equal(chosen.list.textContent.includes('Apple & Pear'), true);
  chosen.input.value = 'Orange';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  const row = Array.from(chosen.list.querySelectorAll('[role="option"]')).find(node => node.textContent === 'Orange');
  assert.ok(row);
  click(row);
  assert.equal(new dom.window.FormData(form).get('fruit'), 'o');
  chosen.destroy();
  dom.window.close();
});

test('opt-in mobile picker closes and restores page scrolling without changing the select value', () => {
  const { dom, select, form } = fixture('<select name="project"><option value=""></option><option value="atlas">Atlas</option></select>');
  window.matchMedia = () => ({ matches: true });
  document.body.style.overflow = 'auto';
  const chosen = new Chosen(select, { mobile_fullscreen: true });
  chosen.open();
  assert.equal(chosen.host.classList.contains('chosen-native--mobile-fullscreen'), true);
  assert.equal(document.body.style.overflow, 'hidden');
  click(chosen.mobileClose);
  assert.equal(chosen.opened, false);
  assert.equal(document.body.style.overflow, 'auto');
  chosen.open();
  click(Array.from(chosen.list.querySelectorAll('[role="option"]')).find(row => row.textContent === 'Atlas'));
  assert.equal(new dom.window.FormData(form).get('project'), 'atlas');
  chosen.destroy();
  dom.window.close();
});

test('single keyboard shortcuts open, close at the first result, and clear an allowed selection', () => {
  const { dom, select } = fixture('<select><option value=""></option><option value="a" selected>Apple</option><option value="b">Banana</option></select>');
  const changes = [];
  select.addEventListener('change', () => changes.push(select.value));
  const chosen = new Chosen(select, { allow_single_deselect: true });

  key(chosen.input, 'Delete');
  assert.equal(select.value, '');
  key(chosen.input, 'Enter');
  assert.equal(chosen.opened, true);
  key(chosen.input, 'ArrowUp');
  assert.equal(chosen.opened, false);
  key(chosen.input, 'Enter');
  key(chosen.input, 'Enter');
  assert.equal(select.value, 'a');
  key(chosen.input, 'Backspace');
  assert.equal(select.value, '');
  assert.deepEqual(changes, ['', 'a', '']);

  chosen.destroy();
  dom.window.close();
});

test('opt-in Shift selection adds a visible range to the native select', () => {
  const markup = '<select multiple><option value="a">Alpha</option><option value="b">Beta</option><option value="c" disabled>Charlie</option><option value="d">Delta</option><option value="e">Echo</option></select>';
  const { dom, select } = fixture(markup);
  let changes = 0;
  select.addEventListener('change', () => changes++);
  const chosen = new Chosen(select, { shift_select_range: true, max_selected_options: 3 });
  let limits = 0;
  select.addEventListener('chosen:maxselected', () => limits++);
  chosen.open();
  click(chosen.list.querySelector('#' + chosen.id + '-option-0'));
  chosen.open();
  chosen.list.querySelector('#' + chosen.id + '-option-4').dispatchEvent(
    new dom.window.MouseEvent('click', { bubbles: true, shiftKey: true }));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'b', 'd']);
  assert.equal(changes, 2);
  assert.equal(limits, 1);
  chosen.destroy();
  dom.window.close();

  const second = fixture(markup);
  const plain = new Chosen(second.select);
  plain.open();
  click(plain.list.querySelector('#' + plain.id + '-option-0'));
  plain.open();
  plain.list.querySelector('#' + plain.id + '-option-4').dispatchEvent(
    new second.dom.window.MouseEvent('click', { bubbles: true, shiftKey: true }));
  assert.deepEqual(Array.from(second.select.selectedOptions, option => option.value), ['a', 'e']);
  plain.destroy();
  second.dom.window.close();
});

test('no-results events expose the rendered row and report its removal', () => {
  const { dom, select } = fixture('<select multiple><option>Apple</option></select>');
  const events = [];
  for (const name of ['chosen:no_results', 'chosen:no_results_clear']) {
    select.addEventListener(name, event => {
      events.push([name, event.detail.search_term, event.detail.no_results.isConnected]);
      if (name === 'chosen:no_results') event.detail.no_results.textContent = 'Custom empty result';
    });
  }
  const chosen = new Chosen(select);
  chosen.open();
  chosen.input.value = 'missing';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.empty.textContent, 'Custom empty result');
  chosen.input.value = '';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.deepEqual(events, [
    ['chosen:no_results', 'missing', true],
    ['chosen:no_results_clear', 'missing', true]
  ]);
  chosen.close();
  assert.equal(events.length, 2);
  chosen.destroy();
  dom.window.close();
});

test('localized no-results templates place and escape the search term', () => {
  const { dom, select } = fixture('<select multiple><option>Apple</option></select>');
  const chosen = new Chosen(select, { no_results_template: 'For {search}, no <matches>.' });
  chosen.open();
  chosen.input.value = '&';
  chosen.renderResults();
  assert.equal(chosen.empty.textContent, 'For &, no <matches>.');
  assert.equal(chosen.empty.querySelector('span').textContent, '&');
  assert.equal(chosen.empty.querySelector('matches'), null);
  chosen.options.no_results_template = 'Nothing here.';
  chosen.renderResults();
  assert.equal(chosen.empty.textContent, 'Nothing here.');
  assert.equal(chosen.empty.querySelector('span'), null);
  chosen.destroy();
  dom.window.close();
});

test('single selection preserves native values, form data, events, and update lifecycle', () => {
  const { dom, select, form } = fixture('<label for="fruit">Fruit</label><select id="fruit" name="fruit"><option value=""></option><option value="apple">Apple</option><option value="pear">Pear</option></select>');
  const events = [];
  for (const name of ['chosen:ready', 'input', 'change']) select.addEventListener(name, () => events.push(name));
  const chosen = new Chosen(select, { allow_single_deselect: true });
  assert.deepEqual(events, ['chosen:ready']);
  chosen.open();
  click(chosen.list.querySelectorAll('[role="option"]')[1]);
  assert.equal(select.value, 'pear');
  assert.equal(new dom.window.FormData(form).get('fruit'), 'pear');
  assert.deepEqual(events, ['chosen:ready', 'input', 'change']);
  assert.equal(chosen.opened, false);
  chosen.clear();
  assert.equal(select.value, '');
  assert.deepEqual(events.slice(-2), ['input', 'change']);
  select.append(new dom.window.Option('Banana', 'banana'));
  select.dispatchEvent(new dom.window.CustomEvent('chosen:updated'));
  assert.equal(chosen.entries.some(item => item.value === 'banana'), true);
  chosen.destroy();
  assert.equal(select.getAttribute('tabindex'), null);
  assert.equal(select.getAttribute('aria-hidden'), null);
  assert.equal(document.querySelector('.chosen-native'), null);
  dom.window.close();
});

test('multiple selection handles search, keyboard, limits, removal, and reset', async () => {
  const { dom, select, form } = fixture('<select name="items" multiple><option value="a" selected>Alpha</option><option value="b">Beta</option><option value="c">Charlie</option></select>');
  let changed = 0;
  select.addEventListener('change', () => changed++);
  const chosen = new Chosen(select, { max_selected_options: 2, hide_results_on_select: false });
  chosen.open();
  chosen.input.value = 'be';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.list.querySelectorAll('[role="option"]').length, 1);
  key(chosen.input, 'Enter');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'b']);
  assert.equal(changed, 1);
  chosen.input.value = '';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  click(Array.from(chosen.list.querySelectorAll('[role="option"]')).find(row => row.textContent === 'Charlie'));
  assert.equal(changed, 1);
  click(chosen.chips.querySelector('button'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['b']);
  form.reset();
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual(Array.from(select.options).filter(option => option.selected).map(option => option.value), ['a']);
  assert.equal(chosen.chips.textContent.includes('Alpha'), true);
  chosen.destroy();
  dom.window.close();
});

test('external select changes and disabled state synchronize without synthetic change events', () => {
  const { dom, select } = fixture('<select><option value="a">Alpha</option><option value="b">Beta</option></select>');
  let changes = 0;
  select.addEventListener('change', () => changes++);
  const chosen = new Chosen(select);
  select.value = 'b';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(chosen.value.textContent, 'Beta');
  assert.equal(changes, 1);
  select.disabled = true;
  chosen.update();
  chosen.open();
  assert.equal(chosen.opened, false);
  assert.equal(chosen.input.disabled, true);
  chosen.destroy();
  dom.window.close();
});

test('selected multiple results show removal state and toggle through pointer or keyboard', () => {
  const { dom, select } = fixture('<select multiple><optgroup label="Team"><option value="a" selected>Alpha</option><option value="b">Beta</option></optgroup></select>');
  let changes = 0;
  select.addEventListener('change', () => changes++);
  const chosen = new Chosen(select, { deselect_selected_results: true, hide_results_on_select: false });
  chosen.open();
  let selected = chosen.list.querySelector('.chosen-native__option--selected');
  assert.equal(selected.textContent, 'Alpha');
  assert.equal(selected.getAttribute('aria-selected'), 'true');
  assert.equal(selected.parentElement.getAttribute('role'), 'group');
  click(selected);
  assert.equal(select.options[0].selected, false);
  assert.equal(changes, 1);
  selected = chosen.list.querySelector('[role="option"]');
  click(selected);
  assert.equal(select.options[0].selected, true);
  assert.equal(changes, 2);
  chosen.highlight(1);
  key(chosen.input, 'Enter');
  assert.equal(select.options[0].selected, false);
  assert.equal(changes, 3);
  chosen.destroy();
  dom.window.close();
});

test('classic multiple defaults keep selected result rows inert and close after a new choice', () => {
  const { dom, select } = fixture('<select multiple><option value="a" selected>Alpha</option><option value="b">Beta</option></select>');
  const chosen = new Chosen(select);
  chosen.open();
  click(Array.from(chosen.list.querySelectorAll('[role="option"]')).find(row => row.textContent === 'Alpha'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a']);
  assert.equal(chosen.opened, true);
  click(Array.from(chosen.list.querySelectorAll('[role="option"]')).find(row => row.textContent === 'Beta'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'b']);
  assert.equal(chosen.opened, false);
  chosen.destroy();
  dom.window.close();
});

test('selected choices collapse with customizable summary copy without changing native values', () => {
  const { dom, select } = fixture('<select multiple><option value="a" selected>Alpha</option><option value="b" selected>Beta</option><option value="c" selected>Charlie</option></select>');
  const chosen = new Chosen(select, { max_items_shown: 1,
    more_items_text: count => `${count} hidden`, show_fewer_items_text: 'Show everything' });
  assert.equal(chosen.chips.querySelectorAll('.chosen-native__chip[hidden]').length, 2);
  assert.equal(chosen.chips.querySelector('.chosen-native__summary').textContent, '2 hidden');
  click(chosen.chips.querySelector('.chosen-native__summary'));
  assert.equal(chosen.chips.querySelectorAll('.chosen-native__chip[hidden]').length, 0);
  assert.equal(chosen.chips.querySelector('.chosen-native__summary').textContent, 'Show everything');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'b', 'c']);
  select.options[1].selected = false;
  select.options[2].selected = false;
  chosen.update();
  assert.equal(chosen.chips.querySelector('.chosen-native__summary'), null);
  chosen.destroy();
  dom.window.close();
});

test('bulk actions select filtered options, respect limits, and preserve disabled selections', () => {
  const { dom, select } = fixture('<select multiple><option value="locked" selected disabled>Locked</option><option value="b">Beta</option><option value="c">Charlie</option><option value="d">Delta</option></select>');
  let changes = 0;
  let limits = 0;
  select.addEventListener('change', () => changes++);
  select.addEventListener('chosen:maxselected', () => limits++);
  const chosen = new Chosen(select, { allow_select_all: true, allow_deselect_all: true,
    select_all_text: 'Add all', deselect_all_text: 'Clear all', max_selected_options: 2 });
  chosen.open();
  assert.equal(chosen.bulkActions.textContent, 'Add all');
  click(chosen.bulkActions.querySelector('button'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['locked', 'b']);
  assert.equal(changes, 1);
  assert.equal(limits, 1);
  click(Array.from(chosen.bulkActions.querySelectorAll('button')).find(button => button.textContent === 'Clear all'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['locked']);
  key(chosen.input, 'a', { ctrlKey: true });
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['locked', 'b']);
  key(chosen.input, 'A', { ctrlKey: true, shiftKey: true });
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['locked']);
  chosen.input.value = 'ch';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  click(chosen.bulkActions.querySelector('button'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['locked', 'c']);
  assert.equal(changes, 5);
  chosen.destroy();
  dom.window.close();
});

test('opt-in paste selects existing values and leaves unmatched tokens in search', () => {
  const { dom, select } = fixture('<select multiple><option value="a">Alpha</option><option value="b">Beta</option><option value="c" disabled>Charlie</option></select>');
  const chosen = new Chosen(select, { paste_multiple_values: true, max_selected_options: 1 });
  const paste = new dom.window.Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(paste, 'clipboardData', { value: { getData: () => 'Alpha, Beta, Charlie, unknown' } });
  chosen.input.dispatchEvent(paste);
  assert.equal(paste.defaultPrevented, true);
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a']);
  assert.equal(chosen.input.value, 'Beta, Charlie, unknown');
  chosen.destroy();
  dom.window.close();
});

test('delayed search flushes before Enter so a stale result is not selected', () => {
  const { dom, select } = fixture('<select><option value=""></option><option value="a">Apple</option><option value="b">Banana</option></select>');
  const chosen = new Chosen(select, { search_delay: 1000 });
  chosen.open();
  chosen.input.value = 'Ban';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.available.some(item => item.label === 'Apple'), true);
  key(chosen.input, 'Enter');
  assert.equal(select.value, 'b');
  assert.equal(chosen.searchTimer, null);
  chosen.destroy();
  dom.window.close();
});

test('delayed search waits for a stable query before filtering', async () => {
  const { dom, select } = fixture('<select><option value=""></option><option value="a">Apple</option><option value="b">Banana</option></select>');
  const chosen = new Chosen(select, { search_delay: 10 });
  chosen.open();
  chosen.input.value = 'Ban';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.available.some(item => item.label === 'Apple'), true);
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.deepEqual(chosen.available.map(item => item.label), ['Banana']);
  chosen.destroy();
  dom.window.close();
});

test('width options preserve CSS sizing and fixed dropdown listeners clean up', () => {
  const { dom, select } = fixture('<select><option value="a">Alpha</option><option value="b">Beta</option></select>');
  const chosen = new Chosen(select, { width: '18rem', dropdown_width: '150%', dropdown_position: 'fixed' });
  assert.equal(chosen.host.style.width, '18rem');
  chosen.open();
  assert.equal(chosen.popup.style.position, 'fixed');
  assert.equal(chosen.popup.style.width, '0px');
  assert.equal(chosen.host.classList.contains('chosen-native--floating'), true);
  chosen.options.width = false;
  chosen.update();
  assert.equal(chosen.host.style.width, '');
  chosen.options.dropdown_position = 'absolute';
  chosen.update();
  assert.equal(chosen.popup.style.position, '');
  assert.equal(chosen.popup.style.width, '150%');
  chosen.close();
  chosen.destroy();
  dom.window.close();
});

test('new options preserve native submission and creation messages use plain text', () => {
  const { dom, select, form } = fixture('<select name="items" multiple data-create_option_text="Add item:"><option value="a">Apple</option></select>');
  const chosen = new Chosen(select, { create_option: true, skip_no_results: true,
    persistent_create_option: true, hide_results_on_select: false });
  chosen.input.value = '<Mango>';
  chosen.open();
  const create = chosen.list.querySelector('.chosen-native__option--create');
  assert.equal(create.textContent, 'Add item: <Mango>');
  assert.equal(create.children.length, 0);
  assert.equal(chosen.empty.hidden, true);
  key(chosen.input, 'Enter');
  assert.deepEqual(new dom.window.FormData(form).getAll('items'), ['<Mango>']);
  assert.equal(select.options.length, 2);
  chosen.input.value = 'App';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.list.querySelector('.chosen-native__option--create')?.textContent, 'Add item: App');
  chosen.input.value = 'Apple';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.list.querySelector('.chosen-native__option--create'), null);
  chosen.destroy();
  dom.window.close();
});

test('creation callback can own the new native option and a selection limit prevents creation', () => {
  const { dom, select } = fixture('<select multiple><option value="a" selected>Apple</option></select>');
  let called = 0;
  const chosen = new Chosen(select, { create_option(query) {
    called++;
    this.select.add(new dom.window.Option(query.toUpperCase(), query, true, true));
  }, max_selected_options: 1 });
  chosen.input.value = 'Mango';
  chosen.open();
  click(chosen.list.querySelector('.chosen-native__option--create'));
  assert.equal(called, 0);
  assert.equal(select.options.length, 1);
  chosen.options.max_selected_options = 2;
  click(chosen.list.querySelector('.chosen-native__option--create'));
  assert.equal(called, 1);
  assert.equal(select.options[1].text, 'MANGO');
  chosen.destroy();
  dom.window.close();
});

test('always-visible options are not bulk matches and a group label selects available members', () => {
  const { dom, select } = fixture('<select multiple select-by-group><optgroup label="Team"><option value="a">Alpha</option><option value="b" disabled>Beta</option><option value="c">Charlie</option></optgroup><option value="other" data-chosen-always-visible>Other</option></select>');
  const chosen = new Chosen(select, { allow_select_all: true, max_selected_options: 2,
    max_shown_results: 1, hide_results_on_select: false });
  chosen.input.value = 'zzz';
  chosen.open();
  assert.deepEqual(chosen.available.map(item => item.label), ['Other']);
  assert.equal(chosen.bulkActions.textContent, '');
  chosen.input.value = '';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  click(chosen.list.querySelector('.chosen-native__group-label--selectable'));
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a']);
  chosen.options.max_shown_results = 3;
  chosen.update();
  chosen.highlight(0);
  key(chosen.input, 'Enter');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'c']);
  chosen.destroy();
  dom.window.close();
});

test('an unmatched pinned option does not take Enter from the creation row', () => {
  const { dom, select } = fixture('<select multiple><option value="other" data-chosen-always-visible>Other</option></select>');
  const chosen = new Chosen(select, { create_option: true, skip_no_results: true });
  chosen.open();
  chosen.input.value = 'New skill';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(chosen.activeIndex, chosen.createIndex);
  key(chosen.input, 'Enter');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['New skill']);
  chosen.destroy();
  dom.window.close();
});

test('select data options use strict parsing and explicit options take precedence', () => {
  const { dom, select } = fixture('<select data-disable-search="true" data-max-selected-options="2" data-width="false" data-search-input-type="text" data-unknown-option="yes"><option value="a">Alpha</option><option value="b">Beta</option></select>');
  const chosen = new Chosen(select, { disable_search: false });
  assert.equal(chosen.options.disable_search, false);
  assert.equal(chosen.options.max_selected_options, 2);
  assert.equal(chosen.options.width, false);
  assert.equal(chosen.input.type, 'text');
  assert.equal(chosen.options.unknown_option, undefined);
  chosen.destroy();
  select.setAttribute('data-disable-search', 'maybe');
  select.setAttribute('data-max-selected-options', '-1');
  const again = new Chosen(select);
  assert.equal(again.options.disable_search, false);
  assert.equal(again.options.max_selected_options, undefined);
  again.destroy();
  dom.window.close();
});

test('source ARIA and native lifecycle events reach the generated input', () => {
  const { dom, select } = fixture('<label id="label" for="project">Project</label><span id="hint">Help</span><select id="project" aria-labelledby="label" aria-describedby="hint" aria-invalid="true"><option value="a">Alpha</option><option value="b">Beta</option></select>');
  const events = [];
  const chosen = new Chosen(select);
  for (const name of ['chosen:search', 'chosen:search_updated']) {
    select.addEventListener(name, event => events.push([name, event.detail.search_term]));
  }
  assert.equal(chosen.input.getAttribute('aria-labelledby'), 'label');
  assert.equal(chosen.input.getAttribute('aria-describedby'), `hint ${chosen.status.id}`);
  assert.equal(chosen.input.getAttribute('aria-invalid'), 'true');
  assert.equal(chosen.host.classList.contains('chosen-native--invalid'), true);
  select.dispatchEvent(new dom.window.Event('chosen:open'));
  assert.equal(chosen.opened, true);
  chosen.input.value = 'Bet';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.deepEqual(events, [['chosen:search', 'Bet'], ['chosen:search_updated', 'Bet']]);
  select.dispatchEvent(new dom.window.Event('chosen:close'));
  assert.equal(chosen.opened, false);
  select.removeAttribute('aria-invalid');
  chosen.update();
  assert.equal(chosen.input.hasAttribute('aria-invalid'), false);
  assert.equal(chosen.host.classList.contains('chosen-native--invalid'), false);
  chosen.destroy();
  dom.window.close();
});

test('classic search settings reach the shared matcher without changing select values', () => {
  const { dom, select } = fixture('<select><option value=""></option><option value="zebra">The Zebra</option><option value="special">Café</option><option value="whale">The Whale</option></select>');
  const chosen = new Chosen(select, { search_contains: true, enable_split_word_search: false,
    search_in_values: true, case_sensitive_search: true, max_search_length: 1000,
    normalize_search_text: text => text.replace('é', 'e'), max_shown_results: 1 });
  chosen.open();
  chosen.input.value = 'Zebra';
  chosen.renderResults();
  assert.deepEqual(chosen.available.map(item => item.label), []);
  chosen.input.value = 'The';
  chosen.renderResults();
  assert.deepEqual(chosen.available.map(item => item.label), ['The Zebra']);
  chosen.options.enable_split_word_search = true;
  chosen.input.value = 'whale';
  chosen.renderResults();
  assert.deepEqual(chosen.available.map(item => item.label), ['The Whale']);
  chosen.input.value = 'zebra';
  chosen.renderResults();
  assert.deepEqual(chosen.available.map(item => item.label), ['The Zebra']);
  chosen.input.value = 'Cafe';
  chosen.renderResults();
  assert.deepEqual(chosen.available.map(item => item.label), ['Café']);
  chosen.options.search_matcher = (query, item) => item.kind === 'option' && item.value === query;
  chosen.input.value = 'special';
  chosen.renderResults();
  assert.deepEqual(chosen.available.map(item => item.label), ['Café']);
  assert.equal(select.value, '');
  chosen.destroy();
  dom.window.close();
});

test('single search can be hidden while prefix typing navigates options', () => {
  const { dom, select } = fixture('<select><option value=""></option><option value="a">Apple</option><option value="b">Banana</option></select>');
  const chosen = new Chosen(select, { disable_search_threshold: 3 });
  assert.equal(chosen.input.readOnly, true);
  assert.equal(chosen.input.getAttribute('aria-autocomplete'), 'none');
  chosen.open();
  key(chosen.input, 'b');
  assert.equal(chosen.available[chosen.activeIndex].label, 'Banana');
  key(chosen.input, 'Enter');
  assert.equal(select.value, 'b');
  chosen.options.disable_search_threshold = 0;
  chosen.update();
  assert.equal(chosen.input.readOnly, false);
  chosen.destroy();
  dom.window.close();
});

test('contains search can prefer a label prefix without changing result order', () => {
  const { dom, select } = fixture('<select><option value="react">React</option><option value="angular">Angular</option></select>');
  const chosen = new Chosen(select, { search_contains: true, highlight_prefix_matches: true });
  chosen.open();
  chosen.input.value = 'a';
  chosen.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.deepEqual(chosen.available.map(item => item.label), ['React', 'Angular']);
  assert.equal(chosen.available[chosen.activeIndex].label, 'Angular');
  assert.equal(chosen.input.getAttribute('aria-activedescendant'), `${chosen.id}-option-1`);
  chosen.destroy();
  dom.window.close();
});

test('type-specific placeholders override fallback without losing source-attribute precedence', () => {
  const { dom, select } = fixture('<select><option value=""></option><option value="a">Alpha</option></select>');
  const chosen = new Chosen(select, { placeholder_text: 'Fallback', placeholder_text_single: 'Choose one' });
  assert.equal(chosen.input.placeholder, 'Choose one');
  select.setAttribute('data-placeholder', 'From markup');
  chosen.update();
  assert.equal(chosen.input.placeholder, 'From markup');
  chosen.destroy();
  dom.window.close();
});

test('a multiple selection hides its closed placeholder once a choice exists', () => {
  const { dom, select } = fixture('<select multiple><option value="a">Alpha</option></select>');
  const chosen = new Chosen(select, { placeholder_text_multiple: 'Choose several' });
  assert.equal(chosen.input.placeholder, 'Choose several');
  select.options[0].selected = true;
  chosen.update();
  assert.equal(chosen.input.placeholder, '');
  chosen.destroy();
  dom.window.close();
});

test('a multiple selection can show an opt-in add-more hint', () => {
  const { dom, select } = fixture('<select multiple data-placeholder="Choose items" data-placeholder-text-multiple-selected="Add another..."><option selected>One</option><option>Two</option></select>');
  const chosen = new Chosen(select);
  assert.equal(chosen.input.placeholder, 'Add another...');
  chosen.open();
  assert.equal(chosen.input.placeholder, 'Add another...');
  select.options[0].selected = false;
  chosen.update();
  assert.equal(chosen.input.placeholder, 'Search options');
  chosen.close();
  assert.equal(chosen.input.placeholder, 'Choose items');
  chosen.destroy();
  dom.window.close();
});

test('multiple keyboard options preserve Backspace and Tab defaults and permit opt-in Tab selection', () => {
  const { dom, select } = fixture('<select multiple><option value="a" selected>Alpha</option><option value="b">Beta</option></select>');
  const chosen = new Chosen(select, { backspace_deletes_choices: false });
  chosen.open();
  key(chosen.input, 'Backspace');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a']);
  chosen.highlight(chosen.available.findIndex(item => item.value === 'b'));
  key(chosen.input, 'Tab');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a']);
  assert.equal(chosen.opened, false);
  chosen.destroy();

  const optIn = new Chosen(select, { multiselect_allow_tab_to_select: true });
  optIn.open();
  optIn.highlight(optIn.available.findIndex(item => item.value === 'b'));
  key(optIn.input, 'Tab');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'b']);
  assert.equal(optIn.opened, false);
  optIn.destroy();
  dom.window.close();
});

test('two-press Backspace focuses the last chip before removing it', () => {
  const { dom, select } = fixture('<select multiple><option value="a" selected>Alpha</option><option value="b" selected>Beta</option></select>');
  const chosen = new Chosen(select, { single_backstroke_delete: false });
  key(chosen.input, 'Backspace');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a', 'b']);
  assert.equal(chosen.chips.querySelector('.chosen-native__chip--pending').textContent.includes('Beta'), true);
  key(chosen.input, 'ArrowDown');
  assert.equal(chosen.chips.querySelector('.chosen-native__chip--pending'), null);
  key(chosen.input, 'Backspace');
  key(chosen.input, 'Backspace');
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['a']);
  chosen.destroy();
  dom.window.close();
});

test('associated labels use type defaults and an explicit open override', () => {
  const { dom, select } = fixture('<label for="items">Items</label><select id="items" multiple><option value="a">Alpha</option></select>');
  const label = document.querySelector('label');
  const chosen = new Chosen(select);
  click(label);
  assert.equal(chosen.opened, true);
  assert.equal(document.activeElement, chosen.input);
  chosen.destroy();
  const focusOnly = new Chosen(select, { open_on_label_click: false });
  click(label);
  assert.equal(focusOnly.opened, false);
  assert.equal(document.activeElement, focusOnly.input);
  focusOnly.destroy();
  dom.window.close();
});

test('search input type follows the classic default with a text override', () => {
  const { dom, select } = fixture('<select><option value="a">Alpha</option></select>');
  const chosen = new Chosen(select);
  assert.equal(chosen.input.type, 'search');
  chosen.destroy();
  const textChosen = new Chosen(select, { search_input_type: 'text' });
  assert.equal(textChosen.input.type, 'text');
  textChosen.destroy();
  dom.window.close();
});

test('the generated control follows source direction and the classic RTL option', () => {
  const { dom, select } = fixture('<select dir="rtl"><option value="a">Alpha</option></select>');
  const chosen = new Chosen(select);
  assert.equal(chosen.host.dir, 'rtl');
  select.dir = 'ltr';
  chosen.update();
  assert.equal(chosen.host.dir, 'ltr');
  select.classList.add('chosen-rtl');
  chosen.update();
  assert.equal(chosen.host.dir, 'rtl');
  chosen.destroy();
  select.classList.remove('chosen-rtl');
  const optIn = new Chosen(select, { rtl: true });
  assert.equal(optIn.host.dir, 'rtl');
  optIn.destroy();
  dom.window.close();
});

test('source class inheritance is opt-in, updates cleanly, and omits internal classes', () => {
  const { dom, select } = fixture('<select class="product-select"><option value="a">Alpha</option></select>');
  const defaultChosen = new Chosen(select);
  assert.equal(defaultChosen.host.classList.contains('product-select'), false);
  defaultChosen.destroy();
  const chosen = new Chosen(select, { inherit_select_classes: true });
  assert.equal(chosen.host.classList.contains('product-select'), true);
  assert.equal(chosen.host.classList.contains('chosen-native__select'), false);
  select.classList.replace('product-select', 'other-select');
  chosen.update();
  assert.equal(chosen.host.classList.contains('product-select'), false);
  assert.equal(chosen.host.classList.contains('other-select'), true);
  chosen.destroy();
  assert.equal(select.classList.contains('other-select'), true);
  dom.window.close();
});

test('option classes and localized result copy follow classic behavior', () => {
  const { dom, select } = fixture('<select multiple data-no_results_text="No matches"><optgroup class="team-group" label="Team"><option class="leader" value="a" selected>Alpha</option><option value="b">Beta</option></optgroup></select>');
  const chosen = new Chosen(select, { inherit_option_classes: true,
    results_count_text: count => `${count} choices` });
  assert.equal(chosen.chips.querySelector('.chosen-native__chip').classList.contains('leader'), true);
  chosen.open();
  assert.equal(chosen.list.querySelector('[role="group"]').classList.contains('team-group'), true);
  assert.equal(chosen.list.querySelector('[role="option"]').classList.contains('leader'), true);
  assert.equal(chosen.status.textContent, '2 choices');
  chosen.input.value = 'missing';
  chosen.renderResults();
  assert.equal(chosen.empty.textContent, 'No matches missing');
  chosen.destroy();
  dom.window.close();
});

test('optgroup classes reach selected chips only when enabled and refresh on update', () => {
  const { dom, select } = fixture('<select multiple><optgroup class="cars" label="Cars"><option selected>Coupe</option></optgroup><option selected>Other</option></select>');
  const chosen = new Chosen(select);
  assert.equal(chosen.chips.querySelector('.chosen-native__chip').classList.contains('cars'), false);
  chosen.destroy();
  const styled = new Chosen(select, { inherit_optgroup_classes: true });
  assert.equal(styled.chips.querySelector('.chosen-native__chip').classList.contains('cars'), true);
  assert.equal(styled.chips.querySelectorAll('.chosen-native__chip')[1].classList.contains('cars'), false);
  select.querySelector('optgroup').className = 'new-cars';
  styled.update();
  assert.equal(styled.chips.querySelector('.chosen-native__chip').classList.contains('new-cars'), true);
  styled.destroy();
  dom.window.close();
});

test('parser config opts into copying source option data attributes to result rows', () => {
  const { dom, select } = fixture('<select><option value="a" data-category="fruit">Alpha</option></select>');
  const chosen = new Chosen(select);
  chosen.open();
  assert.equal(chosen.list.querySelector('[role="option"]').hasAttribute('data-category'), false);
  chosen.options.parser_config = { copy_data_attributes: true };
  chosen.update();
  assert.equal(chosen.list.querySelector('[role="option"]').getAttribute('data-category'), 'fruit');
  chosen.destroy();
  dom.window.close();
});

test('selected value and group options change closed display without changing result labels', () => {
  const { dom, select } = fixture('<select><optgroup label="Team"><option value="alpha" selected>Alpha</option></optgroup></select>');
  const chosen = new Chosen(select, { display_selected_value: true, include_group_label_in_selected: true });
  assert.equal(chosen.value.textContent, 'Team: alpha');
  chosen.open();
  assert.equal(chosen.list.querySelector('[role="option"]').textContent, 'Alpha');
  chosen.destroy();
  select.multiple = true;
  const multi = new Chosen(select, { display_selected_value: true, include_group_label_in_selected: true });
  assert.equal(multi.chips.querySelector('.chosen-native__selected-label').textContent, 'Team: alpha');
  multi.destroy();
  dom.window.close();
});

test('rejects invalid or duplicate initialization and permits reinitialization after destroy', () => {
  const { dom, select } = fixture('<select><option>One</option></select>');
  assert.throws(() => new Chosen(document.querySelector('form')), TypeError);
  const chosen = new Chosen(select);
  assert.throws(() => new Chosen(select), /already initialized/);
  chosen.destroy();
  new Chosen(select).destroy();
  dom.window.close();
});
