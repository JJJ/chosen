# Remote search with Chosen

`chosen-jjj/remote` is an opt-in source controller for large remote collections.
Keep the collection on the server and return a bounded page of `{ value,
label }` records. The controller keeps selected options in the native
`<select>` when the visible result page changes. Submitted values and native
`change` events keep their normal Chosen behavior.

The [jQuery](https://jjj.github.io/chosen/#remote-source-integration),
[Prototype](https://jjj.github.io/chosen/index.proto.html#remote-source-integration),
[Vanilla](https://jjj.github.io/chosen/native.html#remote-source-integration), and
[React](https://jjj.github.io/chosen/react.html#remote-source-integration) demos
use this package API with a simulated asynchronous provider.

## Loader contract

The loader receives a query and `{ signal, limit }`, and returns an array or a
Promise for an array. Values must be stable and unique; labels are inserted as
text. The controller aborts older requests where the loader supports
`AbortSignal`, ignores late responses, removes duplicate values, and caps the
visible page at `limit` records (50 by default). Search and cap results on the
server too. The demo uses a six-record limit.

```js
async function loadProjects(query, { signal, limit }) {
  const url = `/api/projects?q=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url, { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error('Project search failed');
  return response.json(); // [{ value: 'beacon', label: 'Beacon' }, ...]
}
```

## Classic and Vanilla editions

Initialize Chosen first, then connect its search notification and refresh
method. The loader's records are authoritative, so `search_matcher` can return
`true` for the bounded page. `min_search_length` and `search_delay` control
when Chosen emits a query; `minLength` controls when the remote loader runs.

```js
import { connectRemoteSelect } from 'chosen-jjj/remote';

const select = document.querySelector('#projects');
const field = $(select).chosen({
  search_matcher: () => true,
  min_search_length: 2,
  search_delay: 150
});
const remote = connectRemoteSelect(select, {
  load: loadProjects,
  minLength: 2,
  limit: 50,
  subscribe(search) {
    const handler = (event, data) => search(data.search_term);
    field.on('chosen:search_updated', handler);
    return () => field.off('chosen:search_updated', handler);
  },
  update() { field.trigger('chosen:updated'); },
  onStatus(state, query, error, count) {
    // Show loading, result count, or an error in your own status element.
  }
});

// Before removing this control:
remote.dispose();
field.chosen('destroy');
```

For Prototype, `subscribe` uses `select.observe('chosen:search_updated',
handler)` and `update` uses `select.fire('chosen:updated')`. For Vanilla, use
`select.addEventListener('chosen:search_updated', handler)` and
`chosen.update()`. Each subscriber should return a function that removes its
listener. The four demos show the complete wiring.

The controller retains the original selected options and a blank single-select
placeholder. Any initial unselected options are removed when it connects, so
the native select holds only selected values and the current bounded page.
Call `remote.refresh()` to request the current query again. `remote.dispose()`
aborts work and removes the subscribed listener.

## React edition

`useRemoteOptions` keeps the current page and selected records available to
the React component. Pass the selected value and any initially selected option
records to the hook, then use its `options` and `search` values with `Chosen`.

```jsx
import { Chosen, useRemoteOptions } from 'chosen-jjj/react';

function ProjectPicker({ values, setValues, selectedOptions }) {
  const remote = useRemoteOptions({
    load: loadProjects, value: values, selectedOptions, minLength: 2, limit: 50
  });
  return <>
    <Chosen multiple name="projects" value={values} onChange={setValues}
      options={remote.options} onSearchUpdated={remote.search}
      searchMatcher={() => true} minSearchLength={2} searchDelay={150} />
    <output role="status">{remote.status === 'loading' ? 'Loading…' :
      remote.status === 'error' ? 'Search failed' :
      remote.status === 'ready' ? `${remote.count} results` : ''}</output>
  </>;
}
```

Chosen still submits through its native select. Keep `values` controlled and
provide records for values selected before the first remote search. The hook
remembers selected records returned by later searches.

This design keeps only a bounded page plus selected options in the browser.
It does not virtualize a large, already populated native select. Free-text
creation remains a separate opt-in feature.
