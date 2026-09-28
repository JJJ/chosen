# Vanilla JavaScript edition

The experimental `chosen-jjj/native` entry enhances an existing `<select>` without jQuery, Prototype, or React. It does not change the package's default jQuery entry point. [Try the live demo](native.html).

```js
import { Chosen } from 'chosen-jjj/native';
import 'chosen-jjj/native/styles.css';

const select = document.querySelector('#project');
const chosen = new Chosen(select, {
  allow_single_deselect: true,
  search_contains: true
});
```

For a plain browser script, load `dist/native/chosen.css` and `dist/native/chosen.native.js`, then call `new ChosenNative.Chosen(select, options)`.

The original select remains in the form. Chosen changes its option selection and dispatches bubbling native `input` and `change` events after user changes. Call `chosen.update()` after editing its options or state; a native `select.dispatchEvent(new Event('chosen:updated'))` works too. The adapter listens for native events. jQuery's `.trigger('chosen:updated')` does not dispatch a native DOM event.

Selected results remain visible by default. In a multiple select, click a selected result or press Enter on it to remove it; the × mark indicates this action. Grouped options are indented under their headings. Set `display_selected_options: false` to hide selected results instead.

Call `chosen.open()`, `chosen.close()`, `chosen.focus()`, `chosen.blur()`, or `chosen.clear()` as needed. `chosen.destroy()` removes the generated control and listeners and restores the select's original `tabindex` and `aria-hidden` attributes. A second instance on the same select is rejected until the first is destroyed.

## Supported options

| Option | Default | Effect |
| --- | --- | --- |
| `allow_single_deselect` | `false` | Show a clear button when the first single-select option is blank. |
| `placeholder_text` | “Select an Option” or “Select Some Options” | Text shown before a selection; `data-placeholder` and native `placeholder` on the select take precedence. |
| `search_placeholder` | “Search options” | Text in the open search input. |
| `no_results_text` | “No results for:” | Text shown when nothing matches. |
| `search_contains` | `false` | Match within words. |
| `split_search_terms` | `false` | Match whitespace-separated words in any order. |
| `group_search` | `true` | Include optgroup labels in search. |
| `display_selected_options` | `true` | Show selected options in multiple-select results. |
| `display_disabled_options` | `true` | Show disabled options in results. |
| `min_search_length` | `0` | Wait until enough search text is entered. |
| `max_selected_options` | unlimited | Limit multiple-select selection count. |
| `aria_label` | associated label or select label | Accessible name for the generated search input. |

The native edition also reads `data-search-text` on individual options. It does not yet implement the full classic option set, including option creation, bulk actions, fixed or custom-width dropdowns, or the classic `data-*` initialization option parser. Those remain available in the jQuery and Prototype editions. The generated `chosen-native__*` markup and CSS selectors are experimental.

## Events and forms

Listen on the original select. Lifecycle events are native `CustomEvent`s with `event.detail.chosen` pointing to the instance: `chosen:ready`, `chosen:showing_dropdown`, `chosen:hiding_dropdown`, `chosen:no_results`, and `chosen:maxselected`. Native `input` and `change` are ordinary bubbling `Event`s. `chosen:no_results` also includes `event.detail.search_term`.

The adapter follows external native `change` events, native form reset, the select's `disabled` and `readonly` states on `update()`, and native constraint validation. The generated input provides the visible focus target. The select's actual options and selected values remain authoritative.
