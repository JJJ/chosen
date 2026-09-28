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
  render(h(Chosen, { options, multiple: true, maxSelectedOptions: 1, hideResultsOnSelect: false,
    onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
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
  render(h(Chosen, { options, multiple: true, defaultValue: ['a'],
    deselectSelectedResults: true, 'aria-label': 'Fruit' }));
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
    defaultValue: ['a'], maxSelectedOptions: 1, deselectSelectedResults: true,
    hideResultsOnSelect: false, onChange: value => changes.push(value),
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

test('React classic multiple defaults keep selected rows inert and close after selection', () => {
  const changes = [];
  render(h(Chosen, { options, multiple: true, defaultValue: ['a'],
    onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
  assert.deepEqual(changes, []);
  assert.equal(input.getAttribute('aria-expanded'), 'true');
  fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
  assert.deepEqual(changes, [['a', 'b']]);
  assert.equal(input.getAttribute('aria-expanded'), 'false');
});

test('React collapses selected chips with localized summary and keeps native values', () => {
  render(h('form', null, h(Chosen, { options: [
    { value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Charlie' }
  ], multiple: true, defaultValue: ['a', 'b', 'c'], name: 'choices',
  maxItemsShown: 1, moreItemsText: count => `${count} hidden`,
  showFewerItemsText: 'Show everything', 'aria-label': 'Choices' })));
  assert.equal(document.querySelectorAll('.chosen-react__chip[hidden]').length, 2);
  const summary = screen.getByRole('button', { name: '2 hidden' });
  fireEvent.click(summary);
  assert.equal(document.querySelectorAll('.chosen-react__chip[hidden]').length, 0);
  assert.equal(screen.getByRole('button', { name: 'Show everything' }).getAttribute('aria-expanded'), 'true');
  assert.deepEqual(new FormData(document.querySelector('form')).getAll('choices'), ['a', 'b', 'c']);
});

test('React bulk actions honor filtering, selection limits, and disabled values', () => {
  const changes = [];
  render(h('form', null, h(Chosen, { options: [
    { value: 'locked', label: 'Locked', disabled: true },
    { value: 'b', label: 'Beta' }, { value: 'c', label: 'Charlie' }, { value: 'd', label: 'Delta' }
  ], multiple: true, defaultValue: ['locked'], name: 'choices', maxSelectedOptions: 2,
  allowSelectAll: true, allowDeselectAll: true, selectAllText: 'Add all',
  deselectAllText: 'Clear all', onChange: value => changes.push(value),
  'aria-label': 'Choices' })));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.click(screen.getByRole('button', { name: 'Add all' }));
  assert.deepEqual(new FormData(document.querySelector('form')).getAll('choices'), ['locked', 'b']);
  assert.deepEqual(changes, [['locked', 'b']]);
  fireEvent.keyDown(input, { key: 'A', ctrlKey: true, shiftKey: true });
  assert.deepEqual(new FormData(document.querySelector('form')).getAll('choices'), ['locked']);
  fireEvent.change(input, { target: { value: 'ch' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add all' }));
  assert.deepEqual(new FormData(document.querySelector('form')).getAll('choices'), ['locked', 'c']);
  assert.equal(changes.length, 3);
});

test('React opt-in paste selects existing values and keeps unmatched text', () => {
  const changes = [];
  render(h('form', null, h(Chosen, { options, multiple: true, name: 'fruit',
    pasteMultipleValues: true, maxSelectedOptions: 1, onChange: value => changes.push(value),
    'aria-label': 'Fruit' })));
  const input = screen.getByRole('combobox');
  fireEvent.paste(input, { clipboardData: { getData: () => 'Apple; Banana; Cherry; unknown' } });
  assert.deepEqual(changes, [['a']]);
  assert.equal(input.value, 'Banana, Cherry, unknown');
  assert.deepEqual(new FormData(document.querySelector('form')).getAll('fruit'), ['a']);
});

test('single clear and no-results messaging remain keyboard accessible', () => {
  const changes = [];
  render(h(Chosen, { options, defaultValue: 'a', noResultsText: 'Nothing found',
    allowSingleDeselect: true, onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
  assert.equal(document.querySelector('.chosen-react__value')?.textContent, 'Apple');
  fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
  assert.deepEqual(changes, ['']);
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'missing' } });
  assert.match(screen.getByText(/Nothing found/).textContent, /missing/);
});

test('classic search settings filter React results and keep native form values', () => {
  const options = [
    { value: 'zebra', label: 'The Zebra' },
    { value: 'special', label: 'Café' },
    { value: 'whale', label: 'The Whale' }
  ];
  const view = render(h('form', null, h(Chosen, { options, name: 'animal',
    searchContains: true, enableSplitWordSearch: false, caseSensitiveSearch: true,
    searchInValues: true, normalizeSearchText: text => text.replace('é', 'e'),
    maxSearchLength: 1000, maxShownResults: 1, 'aria-label': 'Animal' })));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'Zebra' } });
  assert.equal(screen.queryByRole('option', { name: 'The Zebra' }), null);
  fireEvent.change(input, { target: { value: 'The' } });
  assert.deepEqual(screen.getAllByRole('option').map(row => row.textContent), ['The Zebra']);
  fireEvent.change(input, { target: { value: 'special' } });
  assert.deepEqual(screen.getAllByRole('option').map(row => row.textContent), ['Café']);
  fireEvent.change(input, { target: { value: 'Cafe' } });
  assert.deepEqual(screen.getAllByRole('option').map(row => row.textContent), ['Café']);
  view.rerender(h('form', null, h(Chosen, { options, name: 'animal',
    minSearchLength: 5, searchMatcher: (query, item) => item.kind === 'option' && item.value === query,
    'aria-label': 'Animal' })));
  fireEvent.change(input, { target: { value: 'spec' } });
  assert.equal(screen.queryByRole('option'), null);
  fireEvent.change(input, { target: { value: 'special' } });
  assert.deepEqual(screen.getAllByRole('option').map(row => row.textContent), ['Café']);
  fireEvent.click(screen.getByRole('option', { name: 'Café' }));
  assert.equal(new FormData(document.querySelector('form')).get('animal'), 'special');
});

test('contains search can highlight a later prefix result without reordering options', () => {
  render(h(Chosen, { options: [{ value: 'react', label: 'React' }, { value: 'angular', label: 'Angular' }],
    searchContains: true, highlightPrefixMatches: true, 'aria-label': 'Framework' }));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'a' } });
  const rows = screen.getAllByRole('option');
  assert.deepEqual(rows.map(row => row.textContent), ['React', 'Angular']);
  assert.equal(input.getAttribute('aria-activedescendant'), rows[1].id);
});

test('React defaults to classic word-start search and no-results copy', () => {
  render(h(Chosen, { options: [{ value: 'a', label: 'Banana' }], 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  fireEvent.change(input, { target: { value: 'ana' } });
  assert.equal(screen.queryByRole('option', { name: 'Banana' }), null);
  assert.equal(screen.getByText('No results for: ana').textContent, 'No results for: ana');
  fireEvent.change(input, { target: { value: 'Ban' } });
  assert.ok(screen.getByRole('option', { name: 'Banana' }));
});

test('React hides single search at threshold and supports prefix navigation', () => {
  render(h(Chosen, { options, disableSearchThreshold: 3, 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  assert.equal(input.readOnly, true);
  assert.equal(input.getAttribute('aria-autocomplete'), 'none');
  fireEvent.click(input);
  fireEvent.keyDown(input, { key: 'b' });
  assert.equal(input.getAttribute('aria-activedescendant'), screen.getByRole('option', { name: 'Banana' }).id);
  fireEvent.keyDown(input, { key: 'Enter' });
  assert.equal(document.querySelector('.chosen-react__value')?.textContent, 'Banana');
});

test('React carries option classes and uses literal localized result copy', () => {
  const styled = [{ label: 'Team', className: 'team-group', options: [
    { value: 'a', label: 'Alpha', className: 'leader' }, { value: 'b', label: 'Beta' }
  ] }];
  render(h(Chosen, { options: styled, multiple: true, defaultValue: ['a'],
    inheritOptionClasses: true, resultsCountText: count => `${count} choices`,
    noResultsText: 'No matches', 'aria-label': 'Team' }));
  assert.equal(document.querySelector('.chosen-react__chip').classList.contains('leader'), true);
  const input = screen.getByRole('combobox');
  fireEvent.click(input);
  assert.equal(document.querySelector('.chosen-react__group').classList.contains('team-group'), true);
  assert.equal(screen.getByRole('option', { name: 'Alpha' }).classList.contains('leader'), true);
  assert.equal(screen.getByRole('status').textContent, '2 choices');
  fireEvent.change(input, { target: { value: 'missing' } });
  assert.equal(screen.getByText('No matches missing').textContent, 'No matches missing');
});

test('React matches classic clear and type-specific placeholder defaults', () => {
  const view = render(h(Chosen, { options, value: 'a', 'aria-label': 'Fruit' }));
  assert.equal(screen.queryByRole('button', { name: 'Clear selection' }), null);
  view.rerender(h(Chosen, { options, multiple: true, value: [], 'aria-label': 'Fruit' }));
  assert.equal(screen.getByRole('combobox').placeholder, 'Select Some Options');
  view.rerender(h(Chosen, { options, multiple: true, value: [], placeholder: 'Fallback',
    placeholderTextMultiple: 'Choose several', 'aria-label': 'Fruit' }));
  assert.equal(screen.getByRole('combobox').placeholder, 'Choose several');
  view.rerender(h(Chosen, { options, multiple: true, value: ['a'],
    placeholderTextMultiple: 'Choose several', 'aria-label': 'Fruit' }));
  assert.equal(screen.getByRole('combobox').placeholder, '');
});

test('multiple keyboard settings keep defaults and allow Tab selection', () => {
  const changes = [];
  const view = render(h(Chosen, { options, multiple: true, defaultValue: ['a'],
    backspaceDeletesChoices: false, onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  fireEvent.keyDown(input, { key: 'Backspace' });
  assert.deepEqual(changes, []);
  fireEvent.click(input);
  fireEvent.mouseEnter(screen.getByRole('option', { name: 'Banana' }));
  fireEvent.keyDown(input, { key: 'Tab' });
  assert.deepEqual(changes, []);
  assert.equal(input.getAttribute('aria-expanded'), 'false');

  view.rerender(h(Chosen, { options, multiple: true, defaultValue: ['a'],
    multiselectAllowTabToSelect: true, onChange: value => changes.push(value), 'aria-label': 'Fruit' }));
  fireEvent.click(input);
  fireEvent.mouseEnter(screen.getByRole('option', { name: 'Banana' }));
  fireEvent.keyDown(input, { key: 'Tab' });
  assert.deepEqual(changes, [['a', 'b']]);
  assert.equal(input.getAttribute('aria-expanded'), 'false');
});

test('React two-press Backspace focuses the last chip before removing it', () => {
  const changes = [];
  render(h(Chosen, { options, multiple: true, defaultValue: ['a', 'b'],
    singleBackstrokeDelete: false, onChange: values => changes.push(values), 'aria-label': 'Fruit' }));
  const input = screen.getByRole('combobox');
  fireEvent.keyDown(input, { key: 'Backspace' });
  assert.deepEqual(changes, []);
  assert.equal(document.querySelector('.chosen-react__chip--pending')?.textContent.includes('Banana'), true);
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  assert.equal(document.querySelector('.chosen-react__chip--pending'), null);
  fireEvent.keyDown(input, { key: 'Backspace' });
  fireEvent.keyDown(input, { key: 'Backspace' });
  assert.deepEqual(changes, [['a']]);
});

test('React labels open multiple selects by default and honor the focus-only override', () => {
  const view = render(h(React.Fragment, null,
    h('label', { htmlFor: 'items' }, 'Items'),
    h(Chosen, { id: 'items', options, multiple: true })));
  fireEvent.click(screen.getByText('Items'));
  assert.equal(screen.getByRole('combobox').getAttribute('aria-expanded'), 'true');
  view.rerender(h(React.Fragment, null,
    h('label', { htmlFor: 'items' }, 'Items'),
    h(Chosen, { id: 'items', options, multiple: true, openOnLabelClick: false })));
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
  fireEvent.click(screen.getByText('Items'));
  assert.equal(screen.getByRole('combobox').getAttribute('aria-expanded'), 'false');
});

test('React search input type follows the classic default with a text override', () => {
  const view = render(h(Chosen, { options, 'aria-label': 'Fruit' }));
  assert.equal(screen.getByRole('combobox').type, 'search');
  view.rerender(h(Chosen, { options, searchInputType: 'text', 'aria-label': 'Fruit' }));
  assert.equal(screen.getByRole('combobox').type, 'text');
});

test('selected value and group props change closed display without changing result labels', () => {
  const grouped = [{ label: 'Team', options: [{ value: 'alpha', label: 'Alpha' }] }];
  const props = { options: grouped, defaultValue: 'alpha', displaySelectedValue: true,
    includeGroupLabelInSelected: true, 'aria-label': 'Team member' };
  const view = render(h(Chosen, props));
  assert.equal(document.querySelector('.chosen-react__value').textContent, 'Team: alpha');
  fireEvent.click(screen.getByRole('combobox'));
  assert.equal(screen.getByRole('option', { name: 'Alpha' }).textContent, 'Alpha');
  view.rerender(h(Chosen, { ...props, multiple: true }));
  assert.equal(document.querySelector('.chosen-react__chip')?.textContent, 'Team: alpha×');
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
