import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../../dist/remote/chosen.remote.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

test('remote connector retains native selections and ignores stale responses', async () => {
  const dom = new JSDOM('<select multiple><option value="atlas" selected>Atlas</option></select>',
    { runScripts: 'outside-only' });
  const { window } = dom;
  window.eval(source);
  const select = window.document.querySelector('select');
  const pending = new Map();
  let search;
  let lastQuery = '';
  let updates = 0;
  const remote = window.ChosenRemote.connectRemoteSelect(select, {
    load: query => new Promise(resolve => pending.set(query, resolve)),
    subscribe: handler => { search = handler; },
    update: () => {
      updates++;
      if (search) search(lastQuery); // Refreshing Chosen may repeat its active query.
    }
  });

  lastQuery = 'be';
  search(lastQuery);
  await flush();
  lastQuery = 'co';
  search(lastQuery);
  await flush();
  pending.get('co')([{ value: 'comet', label: 'Comet' }]);
  await flush();
  pending.get('be')([{ value: 'beacon', label: 'Beacon' }]);
  await flush();
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'comet']);
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['atlas']);

  select.options[1].selected = true;
  lastQuery = 'de';
  search(lastQuery);
  await flush();
  pending.get('de')([{ value: 'delta', label: 'Delta' }]);
  await flush();
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'comet', 'delta']);
  assert.deepEqual(Array.from(select.selectedOptions, option => option.value), ['atlas', 'comet']);

  lastQuery = '';
  search(lastQuery);
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'comet']);
  assert.ok(updates >= 4);
  remote.dispose();
  dom.window.close();
});

test('selected options keep their native optgroup and attributes', async () => {
  const dom = new JSDOM('<select multiple><optgroup label="Team"><option value="atlas" data-id="7" selected>Atlas</option><option value="other">Other</option></optgroup></select>',
    { runScripts: 'outside-only' });
  const { window } = dom;
  window.eval(source);
  const select = window.document.querySelector('select');
  const remote = window.ChosenRemote.connectRemoteSelect(select, {
    load: () => [{ value: 'beacon', label: 'Beacon' }],
    subscribe: () => {},
    update: () => {}
  });
  remote.search('be');
  await flush();
  const selected = select.querySelector('optgroup[label="Team"] option');
  assert.equal(selected.value, 'atlas');
  assert.equal(selected.dataset.id, '7');
  assert.equal(selected.selected, true);
  assert.deepEqual(Array.from(select.options, option => option.value), ['atlas', 'beacon']);
  remote.dispose();
  dom.window.close();
});
