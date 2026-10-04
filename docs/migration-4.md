# Moving from Chosen 3.x to 4.0

Chosen 4 keeps the original `<select>` as the source of submitted values and
selection events. The default npm entry remains the jQuery adapter, and the
Prototype script remains available. Existing `.chosen()` calls do not need a
new initializer.

Review these changes if your application inspects Chosen's generated markup,
styles controls by input type, or replaces a source select dynamically:

1. **Search inputs default to `type="search"`.** Chosen's stylesheet targets
   `.chosen-search-input` and suppresses the browser's native clear control.
   If an integration requires the former markup, initialize with
   `search_input_type: "text"` (or set that option in the adapter defaults).
2. **Single-select accessibility attributes have changed.** The closed
   `.chosen-single` is a combobox rather than a button. Its name, controls,
   expansion state, and tab order change as the dropdown opens. The dropdown
   toggles `aria-hidden`, its results list is not a separate Tab stop, and the
   container includes a visually hidden `.chosen-results-status` node. Update
   DOM snapshots, role queries, and direct-child selectors that assume the
   previous generated structure.
3. **Result labels come from native option text.** Chosen no longer copies HTML
   markup from inside an `<option>` into a result or selected chip. Use plain
   option text and the supported styling hooks for presentation. Native option
   values and form submission remain authoritative.
4. **New UI structures are opt-in.** Settings such as `mobile_fullscreen`,
   `dropdown_width`, `dropdown_position: "fixed"`, `max_items_shown`, and bulk
   actions add classes or rows only when enabled. See the
   [4.0 developer notes](../CHANGELOG.md#developer-notes) if your integration
   asserts generated selectors or child counts.

The dependency-free [Vanilla](native.md) and [React](react.md) editions are
explicit package entries and remain experimental. They do not replace the
classic adapters or inherit a page's classic Chosen stylesheet. Check the
[package boundaries](package-boundaries.md) and [adapter parity inventory](adapter-parity.md)
before migrating an existing classic integration to either edition.

After updating the package, import the matching CSS, rebuild your application,
and exercise search, keyboard navigation, form submission, selection events,
and any custom CSS or generated-markup assertions. The [options reference](options.html)
lists the new settings and their defaults.
