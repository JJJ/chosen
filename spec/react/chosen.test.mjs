import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'MutationObserver', 'navigator', 'FormData']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? dom.window : dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = await import('react');
const { render, fireEvent, screen, cleanup, act } = await import('@testing-library/react');
const { renderToString } = await import('react-dom/server');
const { hydrateRoot } = await import('react-dom/client');
const { Chosen } = await import('../../dist/react/index.mjs');
const h = React.createElement;
const options = [
  { value: 'a', label: 'Apple' },
  { label: 'Other', options: [{ value: 'b', label: 'Banana' }, { value: 'c', label: 'Cherry', disabled: true }] }
];

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

test('uncontrolled single selection searches and submits a native form value', () => {
  const changes = [];
  render(h('form', null, h(Chosen, { options, name: 'fruit', 'aria-label': 'Fruit', onChange: value => changes.push(value) })));
  const input = screen.getByRole('combobox', { name: 'Fruit' });
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'ban' } });
  assert.equal(screen.queryByRole('option', { name: 'Apple' }), null);
  assert.ok(screen.getByText('Other'));
  fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
  assert.deepEqual(changes, ['b']);
  assert.equal(new FormData(document.querySelector('form')).get('fruit'), 'b');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
});

test('multiple selection respects limits, disabled options, and removal', () => {
  const changes = [];
  render(h(Chosen, { options, multiple: true, maxSelectedOptions: 1, onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
  assert.deepEqual(changes, [['a']]);
  fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
  fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
  assert.equal(changes.length, 1);
  fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }));
  assert.deepEqual(changes[1], []);
});

test('pointer target and selected result remain distinct', () => {
  render(h(Chosen, { options, multiple: true, defaultValue: ['a'], 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  const apple = screen.getByRole('option', { name: 'Apple' });
  const banana = screen.getByRole('option', { name: 'Banana' });
  const cherry = screen.getByRole('option', { name: 'Cherry' });
  assert.equal(apple.getAttribute('aria-selected'), 'true');
  assert.ok(apple.classList.contains('chosen-react__option--selected'));
  fireEvent.mouseEnter(banana);
  assert.ok(!apple.classList.contains('chosen-react__option--active'));
  assert.ok(banana.classList.contains('chosen-react__option--active'));
  assert.equal(input.getAttribute('aria-activedescendant'), banana.id);
  fireEvent.mouseEnter(cherry);
  assert.equal(input.getAttribute('aria-activedescendant'), banana.id);
});

test('selected multiple results toggle off by pointer and Enter, including at the limit', () => {
  const changes = [];
  render(h('form', null, h(Chosen, { options, name: 'fruit', multiple: true,
    defaultValue: ['a'], maxSelectedOptions: 1, onChange: value => changes.push(value),
    'aria-label': 'Fruit' })));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  const apple = screen.getByRole('option', { name: 'Apple' });
  fireEvent.click(apple);
  assert.deepEqual(changes, [[]]);
  assert.equal(apple.getAttribute('aria-selected'), 'false');
  assert.deepEqual(new FormData(document.querySelector('form')).getAll('fruit'), []);
  fireEvent.click(apple);
  assert.deepEqual(changes[1], ['a']);
  fireEvent.mouseEnter(apple);
  fireEvent.keyDown(input, { key: 'Enter' });
  assert.deepEqual(changes[2], []);
  assert.equal(apple.getAttribute('aria-selected'), 'false');
});

test('single clear and no-results messaging remain keyboard accessible', () => {
  const changes = [];
  render(h(Chosen, { options, defaultValue: 'a', noResultsText: 'Nothing found',
    onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
  assert.equal(document.querySelector('.chosen-react__value')?.textContent, 'Apple');
  fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  assert.deepEqual(changes, ['']);
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'missing' } });
  assert.match(screen.getByText(/Nothing found/).textContent, /missing/);
});

test('controlled values stay controlled across option replacement and form reset', () => {
  const changes = [];
  const view = render(h('form', null, h(Chosen, { options, name: 'fruit', value: 'a', onChange: value => changes.push(value) })));
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
  assert.deepEqual(changes, ['b']);
  assert.equal(new FormData(document.querySelector('form')).get('fruit'), 'a');
  view.rerender(h('form', null, h(Chosen, { options: [options[1]], name: 'fruit', value: 'b' })));
  assert.equal(new FormData(document.querySelector('form')).get('fruit'), 'b');
  fireEvent.reset(document.querySelector('form'));
  assert.equal(new FormData(document.querySelector('form')).get('fruit'), 'b');
});

test('uncontrolled form reset restores default value', () => {
  render(h('form', null, h(Chosen, { options, name: 'fruit', defaultValue: 'a' })));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
  assert.equal(new FormData(document.querySelector('form')).get('fruit'), 'b');
  fireEvent.reset(document.querySelector('form'));
  assert.equal(new FormData(document.querySelector('form')).get('fruit'), 'a');
});

test('external form association, disabled, and read-only behavior use native values', () => {
  render(h(React.Fragment, null,
    h('form', { id: 'remote-form' }),
    h(Chosen, { options, name: 'fruit', form: 'remote-form', defaultValue: 'a', readOnly: true, dir: 'rtl' })));
  const input = screen.getByRole('combobox');
  assert.equal(input.closest('.chosen-react').getAttribute('dir'), 'rtl');
  fireEvent.click(input);
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(new FormData(document.getElementById('remote-form')).get('fruit'), 'a');
});

test('required hidden select tracks browser validity', () => {
  render(h('form', null, h(Chosen, { options, name: 'fruit', required: true })));
  const select = document.querySelector('select[name="fruit"]');
  assert.equal(select.validity.valueMissing, true);
  fireEvent.click(screen.getByRole('combobox'));
  fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
  assert.equal(select.validity.valueMissing, false);
});

test('keyboard navigation, Escape, and imperative methods work in Strict Mode', () => {
  const handle = React.createRef();
  render(h(React.StrictMode, null, h(Chosen, { options, ref: handle, 'aria-label': 'Fruit' })));
  const input = screen.getByRole('combobox');
  act(() => handle.current.open());
  assert.equal(input.getAttribute('aria-expanded'), 'true');
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  assert.ok(input.getAttribute('aria-activedescendant'));
  fireEvent.keyDown(input, { key: 'Escape' });
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  act(() => handle.current.blur());
  assert.notEqual(document.activeElement, input);
});

test('server rendering produces stable combobox and listbox IDs', () => {
  const html = renderToString(h(Chosen, { options, defaultOpen: true, 'aria-label': 'Fruit' }));
  assert.match(html, /role="combobox"/);
  assert.match(html, /role="listbox"/);
  const controls = html.match(/aria-controls="([^"]+)"/)?.[1];
  assert.ok(controls);
  assert.ok(html.includes(`id="${controls}"`));
});

test('server markup hydrates without changing IDs or reporting a mismatch', async () => {
  const element = h(Chosen, { options, defaultValue: 'a', 'aria-label': 'Fruit' });
  const host = document.createElement('div');
  host.innerHTML = renderToString(element);
  document.body.appendChild(host);
  const before = host.querySelector('[role="combobox"]').id;
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  let root;
  try {
    await act(async () => { root = hydrateRoot(host, element); });
    assert.equal(host.querySelector('[role="combobox"]').id, before);
    assert.deepEqual(errors, []);
  } finally {
    console.error = originalError;
    if (root) await act(async () => root.unmount());
    host.remove();
  }
});
