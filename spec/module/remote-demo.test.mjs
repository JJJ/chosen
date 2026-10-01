import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../../docs/docsupport/remote-demo.js', import.meta.url), 'utf8');

test('remote recipe retains selected native values and ignores stale responses', () => {
  const dom = new JSDOM('<select multiple><option value="atlas" selected>Atlas</option></select><output></output>',
    { runScripts: 'outside-only' });
  const { window } = dom;
  window.eval(source);
  const select = window.document.querySelector('select');
  const status = window.document.querySelector('output');
  const pending = new Map();
  let search;
  let updates = 0;
  window.ChosenRemoteDemo.connect(select, handler => { search = handler; }, () => {
    updates++;
    search(lastQuery); // Updating Chosen repeats the active query.
  }, status, (query, done) => pending.set(query, done));

  let lastQuery = 'be';
  search(lastQuery);
  lastQuery = 'co';
  search(lastQuery);
  pending.get('co')(null, [{ value: 'comet', label: 'Comet' }]);
  pending.get('be')(null, [{ value: 'beacon', label: 'Beacon' }]);
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'comet']);
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['atlas']);
  assert.equal(updates, 1);

  select.options[1].selected = true;
  lastQuery = 'de';
  search(lastQuery);
  pending.get('de')(null, [{ value: 'delta', label: 'Delta' }]);
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'comet', 'delta']);
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['atlas', 'comet']);
  assert.equal(updates, 2);

  lastQuery = '';
  search(lastQuery);
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'comet']);
  assert.equal(status.textContent, 'Type at least two characters to search.');
  dom.window.close();
});
