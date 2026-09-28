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

test('rejects invalid or duplicate initialization and permits reinitialization after destroy', () => {
  const { dom, select } = fixture('<select><option>One</option></select>');
  assert.throws(() => new Chosen(document.querySelector('form')), TypeError);
  const chosen = new Chosen(select);
  assert.throws(() => new Chosen(select), /already initialized/);
  chosen.destroy();
  new Chosen(select).destroy();
  dom.window.close();
});
