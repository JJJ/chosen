# Vanilla JavaScript edition

The experimental `chosen-jjj/native` entry enhances an existing `<select>` without jQuery, Prototype, or React. It does not change the package's default jQuery entry point. It is not yet feature complete; see the [adapter parity inventory](adapter-parity.md). [Try the live demo](native.html).

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

Selected results remain visible by default. Set `deselect_selected_results: true` to remove a selected multiple result by click or Enter; its × mark indicates this action. Otherwise selected rows have a check mark and are not actionable. Grouped options are indented under their headings. Set `display_selected_options: false` to hide selected results instead.

Call `chosen.open()`, `chosen.close()`, `chosen.focus()`, `chosen.blur()`, or `chosen.clear()` as needed. `chosen.destroy()` removes the generated control and listeners and restores the select's original `tabindex` and `aria-hidden` attributes. A second instance on the same select is rejected until the first is destroyed.

## Supported options

| Option | Default | Effect |
| --- | --- | --- |
| `allow_single_deselect` | `false` | Show a clear button when the first single-select option is blank. |
| `placeholder_text` | “Select an Option” or “Select Some Options” | Text shown before a selection; `data-placeholder` and native `placeholder` on the select take precedence. |
| `placeholder_text_single` | type default | Override the fallback for single selects; source attributes still take precedence. |
| `placeholder_text_multiple` | type default | Override the fallback for multiple selects; source attributes still take precedence. |
| `search_placeholder` | “Search options” | Text in the open search input. |
| `no_results_text` | “No results for:” | Text shown when nothing matches. |
| `results_count_text` | `count => "N results available"` | Localize the live result-count announcement. |
| `search_contains` | `false` | Match within words. |
| `highlight_prefix_matches` | `false` | With contains search, highlight a visible label prefix before an earlier substring result without changing result order. Does not override `search_matcher`. |
| `enable_split_word_search` | `true` | Match at word boundaries; set `false` to require a label-start match. |
| `case_sensitive_search` | `false` | Preserve case while matching. |
| `search_in_values` | `false` | Also match option values. |
| `max_search_length` | `1000` | Limit the query used for matching without truncating the input. |
| `search_input_type` | `search` | Set to `text` when the host application requires a text input. Input styling uses classes, not its type. |
| `search_delay` | `0` | Debounce filtering by this many milliseconds; navigation and selection keys flush pending search first. |
| `disable_search` | `false` | Hide search on a single select. Prefix typing still moves through open results. |
| `disable_search_threshold` | `0` | Hide single-select search when the source select has this many options or fewer. |
| `normalize_search_text` | identity function | Transform the query and labels before built-in matching. |
| `search_matcher` | built-in matching | Replace built-in matching with `(query, normalizedItem) => boolean`. The item has `kind`, `label`, and (for options) `value`. |
| `max_shown_results` | unlimited | Limit the number of visible option rows, excluding group headings. |
| `split_search_terms` | `false` | Match whitespace-separated words in any order. |
| `group_search` | `true` | Include optgroup labels in search. |
| `display_selected_options` | `true` | Show selected options in multiple-select results. |
| `deselect_selected_results` | `false` | Let selected multiple results be removed from the dropdown. |
| `hide_results_on_select` | `true` | Close the dropdown after a multiple choice; set `false` to keep it open. Ctrl or Command selection keeps it open. |
| `display_selected_value` | `false` | Show the option value in the closed control or selected chips, while keeping its label in results. |
| `include_group_label_in_selected` | `false` | Prefix selected text with its optgroup name when present. |
| `display_disabled_options` | `true` | Show disabled options in results. |
| `min_search_length` | `0` | Wait until enough search text is entered. |
| `max_selected_options` | unlimited | Limit multiple-select selection count. |
| `max_items_shown` | unlimited | Show up to this many selected chips, then a button to reveal the rest. Selection and submitted values do not change. |
| `allow_select_all` | `false` | Add enabled filtered results up to `max_selected_options`; Ctrl/Command+A works when search is empty. |
| `allow_deselect_all` | `false` | Clear enabled selections, including ones outside the current filter; Ctrl/Command+Shift+A works when search is empty. |
| `paste_multiple_values` | `false` | Select uniquely matched existing options from comma, semicolon, tab, or newline-separated pasted text. Unmatched tokens remain in search. |
| `select_all_text` | “Select all” | Label for the bulk select action. |
| `deselect_all_text` | “Deselect all” | Label for the bulk clear action. |
| `more_items_text` | `count => "Show N more..."` | Localize the collapsed summary button. |
| `show_fewer_items_text` | “Show fewer...” | Localize the expanded summary button. |
| `backspace_deletes_choices` | `true` | Remove the final selected choice when Backspace is pressed in an empty multiple-select search field. |
| `single_backstroke_delete` | `true` | Set `false` to focus the final chip with the first Backspace and remove it with the second. |
| `open_on_label_click` | `true` for multiple, `false` for single | Choose whether an associated label opens the popup or only focuses its input. |
| `multiselect_allow_tab_to_select` | `false` | Select the highlighted multiple-select result on Tab while continuing normal focus navigation. |
| `rtl` | `false` | Set right-to-left direction on the generated control; source `dir` and legacy `chosen-rtl` class also work. Call `update()` after changing source direction. |
| `inherit_select_classes` | `false` | Copy source select classes to the generated host. The legacy `chosen-rtl` marker passes through even when this is off; internal `chosen-native` classes are not copied. Call `update()` after changing classes. |
| `inherit_option_classes` | `false` | Option and optgroup classes appear on result rows; set this to also copy option classes to selected chips. |
| `parser_config` | `{}` | Set `{copy_data_attributes: true}` to copy source option `data-*` attributes onto result rows. `data-search-text` still works without this setting. |
| `aria_label` | associated label or select label | Accessible name for the generated search input. |

The native edition also reads `data-search-text` on individual options. It does not yet implement the full classic option set, including option creation, bulk actions, fixed or custom-width dropdowns, or the classic `data-*` initialization option parser. Those remain available in the jQuery and Prototype editions. The generated `chosen-native__*` markup and CSS selectors are experimental.

## Events and forms

Listen on the original select. Lifecycle events are native `CustomEvent`s with `event.detail.chosen` pointing to the instance: `chosen:ready`, `chosen:showing_dropdown`, `chosen:hiding_dropdown`, `chosen:no_results`, and `chosen:maxselected`. Native `input` and `change` are ordinary bubbling `Event`s. `chosen:no_results` also includes `event.detail.search_term`.

The adapter follows external native `change` events, native form reset, the select's `disabled` and `readonly` states on `update()`, and native constraint validation. The generated input provides the visible focus target. The select's actual options and selected values remain authoritative.
