# Chosen package boundaries

The npm package keeps `chosen-jjj` as the classic jQuery entry point. Existing
script files and deep `dist/`, `docs/`, `coffee/`, and `sass/` paths remain
available. Explicit entries make new integrations easier to identify:

| Import | Purpose |
| --- | --- |
| `chosen-jjj` or `chosen-jjj/jquery` | Classic jQuery adapter and its DOM lifecycle. |
| `chosen-jjj/prototype` | Classic Prototype adapter and its DOM lifecycle. |
| `chosen-jjj/core` | Framework-neutral option, search, and selection functions; ESM and CommonJS builds with TypeScript declarations. |
| `chosen-jjj/styles.css` | Standalone default CSS and shared theme variables. |
| `chosen-jjj/scss` | Customizable Sass source. |

The core accepts plain option/group data. It normalizes groups and inherited
disabled/hidden state, filters results with Chosen's search rules, and computes
selection changes without touching the DOM or mutating caller data. The legacy
adapters still parse native `<select>` elements, render their own markup, and
own focus, events, form values, and cleanup. Both adapters use the same core
matcher, visibility rule, and selection-limit rule that the React edition can
call directly.

The source of truth is `core/index.mjs`. `grunt build` copies its ESM source,
generates CommonJS and ES5 browser formats, and includes the browser format in
both legacy builds. `core/index.d.ts` declares the data API. The core has no
jQuery, Prototype, React, or Tailwind runtime dependency.

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
React will not instantiate a jQuery or Prototype control.
