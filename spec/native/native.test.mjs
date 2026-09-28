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

function key(input, name) {
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
}

function click(node) {
  node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}

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
  const chosen = new Chosen(select, { max_selected_options: 2 });
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
  const chosen = new Chosen(select);
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

test('rejects invalid or duplicate initialization and permits reinitialization after destroy', () => {
  const { dom, select } = fixture('<select><option>One</option></select>');
  assert.throws(() => new Chosen(document.querySelector('form')), TypeError);
  const chosen = new Chosen(select);
  assert.throws(() => new Chosen(select), /already initialized/);
  chosen.destroy();
  new Chosen(select).destroy();
  dom.window.close();
});
