import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import * as core from 'chosen-jjj/core';

const require = createRequire(import.meta.url);
const cases = JSON.parse(readFileSync(new URL('../fixtures/core-cases.json', import.meta.url), 'utf8'));

test('core has equivalent ESM and CommonJS package entry points', () => {
  const commonjs = require('chosen-jjj/core');
  assert.deepEqual(Object.keys(commonjs).sort(), Object.keys(core).sort());
  assert.equal(require.resolve('chosen-jjj'), require.resolve('chosen-jjj/jquery'));
  assert.match(require.resolve('chosen-jjj/dist/css/chosen.css'), /dist\/css\/chosen\.css$/);
});

test('normalization preserves groups, inherited states, and caller data', () => {
  const entries = [{ label: 'Group', className: 'group-accent', disabled: true,
    options: [{ value: 'one', label: 'One', className: 'option-accent' }] }];
  const normalized = core.normalizeOptions(entries);
  assert.deepEqual(normalized.map((item) => item.kind), ['group', 'option']);
  assert.equal(normalized[1].groupIndex, 0);
  assert.equal(normalized[1].groupLabel, 'Group');
  assert.equal(normalized[1].disabled, true);
  assert.equal(normalized[0].className, 'group-accent');
  assert.equal(normalized[1].className, 'option-accent');
  assert.equal(entries[0].options[0].disabled, undefined);
  assert.equal(core.normalizeOptions([{ value: 'one', label: '' }])[0].empty, false);
});

test('legacy falsy display settings still hide matching options', () => {
  assert.equal(core.includeOptionInResults({ selected: true }, { multiple: true, displaySelectedOptions: 0 }), false);
  assert.equal(core.includeOptionInResults({ disabled: true }, { displayDisabledOptions: '' }), false);
  assert.equal(core.includeOptionInResults({ selected: true }, { multiple: true }), true);
});

for (const fixture of cases.filterCases) {
  test(`shared filter fixture: ${fixture.name}`, () => {
    const entries = core.normalizeOptions(fixture.options);
    const result = core.filterOptions(entries, fixture.query, fixture.settings);
    assert.deepEqual(result.items.map((item) => item.label), fixture.expected);
    assert.equal(result.count, fixture.expected.filter((label) => !entries.some((item) => item.kind === 'group' && item.label === label)).length);
    assert.deepEqual(core.filterOptions(fixture.options, fixture.query, fixture.settings), result);
  });
}

test('matcher reports primary, alternate, exact, and split-term results', () => {
  const matcher = core.createMatcher('project here', { splitSearchTerms: true });
  const result = matcher({ label: 'The project is here', value: 'one' });
  assert.equal(result.matched, true);
  assert.equal(result.alternate, false);
  assert.equal(result.termMatches.length, 2);
  assert.equal(result.termMatches.every(Boolean), true);
  assert.equal(matcher({ label: 'Cat', searchText: 'project here', value: 'cat' }).alternate, true);
  assert.equal(core.createMatcher('cafe')({ label: 'Café', value: 'cafe' }).matched, true);
  assert.equal(core.createMatcher('cat')({ label: 'Cat', exactText: 'Cat' }).exact, false);
  assert.equal(core.createMatcher('Cat')({ label: 'Cat', exactText: 'Cat' }).exact, true);
});

test('contains search still starts at the option beginning when split word search is disabled', () => {
  const prefix = core.createMatcher('<01M', { enableSplitWordSearch: false, searchContains: true });
  assert.equal(prefix({ label: '<01M Fund' }).matched, true);
  assert.equal(prefix({ label: 'Other <01M Fund' }).matched, false);
  assert.equal(prefix({ label: 'X<01M Fund' }).matched, false);
  assert.equal(core.createMatcher('<01M', { searchContains: true })({ label: 'Other <01M Fund' }).matched, true);
});

test('custom matching and result caps preserve group structure and visibility rules', () => {
  const entries = core.normalizeOptions([
    { label: 'First', options: [{ value: '1', label: 'Alpha' }, { value: '2', label: 'Beta' }] },
    { label: 'Second', options: [{ value: '3', label: 'Gamma' }] }
  ]);
  const visited = [];
  const result = core.filterOptions(entries, 'a', {
    searchMatcher(query, item) {
      visited.push(item.label);
      return item.kind === 'option' && item.label.toLowerCase().includes(query);
    },
    maxShownResults: 2
  });
  assert.deepEqual(result.items.map(item => item.label), ['First', 'Alpha', 'Beta']);
  assert.equal(result.count, 2);
  assert.equal(result.exactMatch, false);
  assert.deepEqual(visited, ['First', 'Alpha', 'Beta', 'Second', 'Gamma']);
  assert.deepEqual(core.filterOptions(entries, '', { maxShownResults: 0 }).items, []);
});

test('prefix preference is limited to visible enabled labels and built-in contains search', () => {
  const items = core.normalizeOptions([
    { value: 'react', label: 'React' },
    { value: 'angular', label: 'Angular' },
    { value: 'astro', label: 'Astro', disabled: true }
  ]);
  const settings = { highlightPrefixMatches: true, searchContains: true };
  assert.equal(core.preferredPrefixIndex(items, 'a', settings), 1);
  assert.equal(core.preferredPrefixIndex(items, 'a', { ...settings, searchMatcher: () => true }), -1);
  assert.equal(core.preferredPrefixIndex(items, 'a', { ...settings, searchContains: false }), -1);
  assert.equal(core.preferredPrefixIndex(items, 'A', { ...settings, caseSensitiveSearch: true }), 1);
});

for (const fixture of cases.selectionCases) {
  test(`shared selection fixture: ${fixture.name}`, () => {
    let values = fixture.initial;
    for (const step of fixture.steps) {
      const previous = values.slice();
      const result = core.updateSelection(values, step.option, { ...fixture.settings, action: step.action || 'select' });
      assert.deepEqual(result.values, step.expected);
      assert.equal(result.changed, step.changed);
      assert.equal(result.limitReached, step.limitReached);
      assert.deepEqual(values, previous, 'selection must not mutate the caller array');
      values = result.values;
    }
  });
}

test('selection rejects hidden and disabled options before checking the limit', () => {
  assert.equal(core.canSelectOption({ value: 'one', disabled: true }, [], { multiple: true }), false);
  assert.equal(core.canSelectOption({ value: 'one', hidden: true }, [], { multiple: true }), false);
  assert.equal(core.canSelectOption({ value: 'two' }, ['one'], { multiple: true, maxSelectedOptions: 1 }), false);
  assert.equal(core.canSelectOption({ value: 'two' }, ['one'], { multiple: false }), true);
  assert.deepEqual(core.updateSelection(['one'], { value: 'one', disabled: true }, { action: 'remove' }).values, ['one']);
  assert.equal(core.canSelectOption({ value: '', label: '' }, [], { multiple: true }), false);
  assert.equal(core.updateSelection([], { value: '', label: '' }, { multiple: true }).changed, false);
});
