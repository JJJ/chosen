# Chosen package boundaries

The npm package keeps `chosen-jjj` as the classic jQuery entry point. Existing
script files and deep `dist/`, `docs/`, `coffee/`, and `sass/` paths remain
available. Explicit entries make new integrations easier to identify:

| Import | Purpose |
| --- | --- |
| `chosen-jjj` or `chosen-jjj/jquery` | Classic jQuery adapter and its DOM lifecycle; supports browser globals, AMD, and CommonJS. |
| `chosen-jjj/prototype` | Classic Prototype adapter and its DOM lifecycle. |
| `chosen-jjj/core` | Framework-neutral option, search, and selection functions; ESM and CommonJS builds with TypeScript declarations. |
| `chosen-jjj/native` | Experimental dependency-free DOM adapter for an existing native select; ESM, CommonJS, and browser builds. |
| `chosen-jjj/native/styles.css` | Standalone vanilla adapter styles using shared `--chosen-*` tokens. |
| `chosen-jjj/react` | Native React component; ESM build and TypeScript declarations with React as a peer dependency. |
| `chosen-jjj/react/styles.css` | Standalone React theme using the shared `--chosen-*` tokens. |
| `chosen-jjj/styles.css` | Standalone default CSS and shared theme variables. |
| `chosen-jjj/scss` | Customizable Sass source. |
| `chosen-jjj/sass/icons/*.svg` | Editable sources for the four control icons embedded in the default CSS. |

The core accepts plain option/group data. It normalizes groups and inherited
disabled/hidden state, filters results with Chosen's search rules, and computes
selection changes without touching the DOM or mutating caller data. The legacy
adapters still parse native `<select>` elements, render their own markup, and
own focus, events, form values, and cleanup. Both adapters use the same core
matcher, visibility rule, and selection-limit rule that the React edition can
call directly. `preferredPrefixIndex()` returns a visible, enabled label-prefix
match for contains search without changing the filtered result order.

The source of truth is `core/index.mjs`. `grunt build` copies its ESM source,
generates CommonJS and ES5 browser formats, and includes the browser format in
both legacy builds. `core/index.d.ts` declares the data API. The core has no
jQuery, Prototype, React, or Tailwind runtime dependency.

The jQuery distribution registers as an AMD module with a `jquery` dependency,
exports the plugin function from CommonJS, or installs on `window.jQuery` when
loaded as a plain script. These paths all install `$.fn.chosen`; existing
`.chosen()` calls and the browser `ChosenCore` global remain available. For
CommonJS, install jQuery alongside Chosen and make a DOM available before
requiring either package:

```js
const $ = require('jquery');
const chosen = require('chosen-jjj');

$('.chosen-select').chosen();
```

The CommonJS export is the same function as `$.fn.chosen`. The browser's AMD
loader supplies jQuery before Chosen evaluates its adapter. The Prototype
distribution remains a browser-global script because Prototype itself does not
provide a CommonJS or AMD package dependency here.

```js
import { normalizeOptions, filterOptions, updateSelection } from 'chosen-jjj/core';

const options = normalizeOptions([
  { label: 'Animals', options: [{ value: 'cat', label: 'Cat' }] },
]);
const results = filterOptions(options, 'cat');
const next = updateSelection([], { value: 'cat' }, { multiple: true });
```

The data API is experimental while the native React MVP is being exercised.
Its exported names and types are explicit, but extension points beyond these
documented functions are not yet promised. Rendering stays in each adapter;
React does not instantiate a jQuery or Prototype control. Its ESM entry bundles
the core rules but leaves React external, and its stylesheet is opt-in.

The vanilla DOM edition is an explicit entry and does not replace the jQuery default. It keeps the original select authoritative and uses native DOM events. Both vanilla and React are still experimental and have known gaps against the classic feature set. See the [adapter parity inventory](adapter-parity.md) before treating either as a replacement for a classic adapter.
