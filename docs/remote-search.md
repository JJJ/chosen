# Remote search with Chosen

Chosen enhances a native `<select>`. For a large remote collection, keep the
collection on your server and put only a bounded page of matches into the
select. Keep every selected option in the select when replacing search results.
That preserves submitted values, native `change` events, and Chosen's existing
selection behavior. The [jQuery](https://jjj.github.io/chosen/#remote-source-integration),
[Prototype](https://jjj.github.io/chosen/index.proto.html#remote-source-integration),
[Vanilla](https://jjj.github.io/chosen/native.html#remote-source-integration), and
[React](https://jjj.github.io/chosen/react.html#remote-source-integration) demos show this with a small
simulated asynchronous provider.

## Server contract

Return a small page of records with stable, unique string values and display
labels, for example:

```json
[{"value":"beacon","label":"Beacon"},{"value":"ember","label":"Ember"}]
```

Search and cap results on the server. Do not send the whole collection to the
browser. The demos cap each response at six records. They use
`min_search_length: 2` and `search_delay: 150` to avoid a request for every
single keystroke. Use `search_contains: true` when the server matches within
labels, as the demos do. A prefix-only server should use the default matching
setting so Chosen does not hide valid returned results.

Replace the demo provider in [remote-demo.js](docsupport/remote-demo.js) with a
request to your own endpoint. Its callback receives an error or the result
records:

```js
function loadProjects(query, done) {
  fetch('/api/projects?q=' + encodeURIComponent(query), {
    credentials: 'same-origin'
  }).then(function (response) {
    if (!response.ok) throw new Error('Project search failed');
    return response.json();
  }).then(function (records) {
    done(null, records);
  }, done);
}
```

The demo helper's `connect(select, subscribe, update, status, loadProjects)`
accepts this function as its last argument. It discards stale responses,
retains selected `<option>` elements, renders result labels as text, handles
request errors, and prevents the `chosen:updated` refresh from repeating the
same request. Copy or adapt the helper for your application; it is demo code,
not a new package API. Validate the returned records and cap them server-side.
For browsers without `fetch`, supply an equivalent request function.

## Connecting an edition

Each edition supplies the search query and refreshes from its native select:

| Edition | Search notification | Refresh after changing `<option>` elements |
| --- | --- | --- |
| jQuery | `chosen:search_updated`, `data.search_term` | `$(select).trigger('chosen:updated')` |
| Prototype | `chosen:search_updated`, `event.memo.search_term` | `select.fire('chosen:updated')` |
| Vanilla | `chosen:search_updated`, `event.detail.search_term` | `chosen.update()` |
| React | `onSearchUpdated(query)` | Update the `options` prop; keep selected values in a controlled `value` prop |

After copying the demo helper into your application, the jQuery wiring is:

```js
var select = document.querySelector('#projects');
var field = $(select).chosen({
  search_contains: true,
  min_search_length: 2,
  search_delay: 150
});

ChosenRemoteDemo.connect(select, function (search) {
  field.on('chosen:search_updated', function (event, data) {
    search(data.search_term);
  });
}, function () {
  field.trigger('chosen:updated');
}, document.querySelector('#project-search-status'), loadProjects);
```

See [init.proto.js](docsupport/init.proto.js),
[native-demo.js](docsupport/native-demo.js), and
[react-demo.jsx](docsupport/react-demo.jsx) for the other working examples.
React keeps its selected values and their option records in component state;
it does not mutate the hidden native select directly.

Free-text creation is a separate opt-in feature (`create_option` in the classic
and Vanilla editions, `createOption` in React). Decide whether users may create
new values independently of the remote search. This recipe does not virtualize
an already populated select and does not add a built-in remote-source option.
