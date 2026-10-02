import assert from 'node:assert/strict';
import test from 'node:test';
import { createRemoteSource } from '../../remote/index.mjs';

const flush = () => new Promise(resolve => setImmediate(resolve));

test('remote source drops stale responses and aborts their signals', async () => {
  const requests = new Map();
  const pages = [];
  const source = createRemoteSource((query, { signal }) => new Promise(resolve => {
    requests.set(query, { signal, resolve });
  }), { onResults: (records, query) => pages.push({ query, records }) });
  source.search('be');
  await flush();
  source.search('co');
  await flush();
  assert.equal(requests.get('be').signal.aborted, true);
  requests.get('co').resolve([{ value: 'cobalt', label: 'Cobalt' }]);
  await flush();
  requests.get('be').resolve([{ value: 'beacon', label: 'Beacon' }]);
  await flush();
  assert.deepEqual(pages.at(-1), { query: 'co', records: [{ value: 'cobalt', label: 'Cobalt' }] });
  source.dispose();
});

test('remote source deduplicates queries and caps unique records', async () => {
  let calls = 0;
  const pages = [];
  const source = createRemoteSource(() => {
    calls++;
    return [{ value: 'a', label: 'A' }, { value: 'a', label: 'Again' },
      { value: 'b', label: 'B' }, { value: 'c', label: 'C' }];
  }, { limit: 2, onResults: records => pages.push(records) });
  source.search('ab');
  await flush();
  source.search('ab');
  await flush();
  assert.equal(calls, 1);
  assert.deepEqual(pages.at(-1), [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]);
  source.refresh();
  await flush();
  assert.equal(calls, 2);
  source.dispose();
});

test('short queries clear results and errors leave a usable controller', async () => {
  const states = [];
  const pages = [];
  const source = createRemoteSource(() => Promise.reject(new Error('offline')), {
    onResults: records => pages.push(records),
    onStatus: state => states.push(state)
  });
  source.search('be');
  await flush();
  assert.equal(states.at(-1), 'error');
  source.search('b');
  assert.equal(states.at(-1), 'idle');
  assert.deepEqual(pages.at(-1), []);
  source.dispose();
});
