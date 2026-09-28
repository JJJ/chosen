import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const jquerySource = fs.readFileSync(require.resolve('jquery'), 'utf8');

function browserContext() {
  const dom = new JSDOM('<select><option>One</option><option>Two</option></select>', {
    runScripts: 'outside-only',
  });
  const context = dom.getInternalVMContext();
  vm.runInContext(jquerySource, context);
  return { dom, context, jquery: context.jQuery };
}

function bundle(name) {
  return fs.readFileSync(path.join(root, 'dist/js', name), 'utf8');
}

test('browser globals still install the jQuery plugin and expose ChosenCore', () => {
  for (const name of ['chosen.jquery.js', 'chosen.jquery.min.js']) {
    const { dom, context, jquery } = browserContext();
    vm.runInContext(bundle(name), context);
    assert.equal(typeof jquery.fn.chosen, 'function');
    assert.equal(typeof context.ChosenCore.filterOptions, 'function');
    jquery('select').chosen();
    assert.ok(jquery('select').data('chosen'));
    dom.window.close();
  }
});

test('AMD waits for its jQuery dependency before installing the plugin', () => {
  const { dom, context, jquery } = browserContext();
  delete context.jQuery;
  delete context.$;
  let registration;
  context.define = (dependencies, factory) => { registration = { dependencies, factory }; };
  context.define.amd = {};

  vm.runInContext(bundle('chosen.jquery.js'), context);
  assert.deepEqual(Array.from(registration.dependencies), ['jquery']);
  assert.equal(jquery.fn.chosen, undefined);
  assert.equal(registration.factory(jquery), jquery.fn.chosen);
  jquery('select').chosen();
  assert.ok(jquery('select').data('chosen'));
  dom.window.close();
});

test('CommonJS exports the plugin and installs it on the required jQuery', () => {
  const dom = new JSDOM('<select><option>One</option><option>Two</option></select>');
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  try {
    const plugin = require('chosen-jjj');
    const jquery = require('jquery');
    assert.equal(plugin, jquery.fn.chosen);
    assert.equal(require('chosen-jjj/jquery'), plugin);
    jquery('select').chosen();
    assert.ok(jquery('select').data('chosen'));
  } finally {
    delete globalThis.window;
    delete globalThis.document;
    dom.window.close();
  }
});
