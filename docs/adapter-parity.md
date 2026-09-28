# Adapter feature parity

Chosen's jQuery and Prototype adapters define the current behavior in [Options and API](options.html). The vanilla JavaScript and React editions are experimental. **Neither is a drop-in replacement yet.** This inventory is based on the source and public APIs on 2026-09-28; keep it current when behavior changes.

The goal is equivalent behavior and defaults in all editions, expressed through each platform's natural API. React props can use camelCase and callbacks; vanilla can use native DOM events. An adapter-specific mechanism is acceptable only when users can achieve the same result. Avoid changing an existing default silently; document a migration or release boundary when aligning one.

`Yes` means the option has equivalent configurable behavior. `Partial` means some behavior exists but the setting, default, or an important edge case differs. `No` means the public adapter does not implement it. The jQuery and Prototype columns are omitted because the classic reference is the baseline, not because their individual tests can be skipped.

| Classic option | Vanilla | React | Gap or equivalent API |
| --- | --- | --- | --- |
| `allow_single_deselect` | Yes | Partial | React always shows its clear action for a selection. |
| `allow_select_all` | No | No | Filtered bulk selection and shortcut. |
| `allow_deselect_all` | No | No | Bulk removal, disabled selection rule, and shortcut. |
| `deselect_selected_results` | Partial | Partial | Both always permit removal from selected result rows; classic defaults off. |
| `select_all_text` | No | No | Localized bulk action label. |
| `deselect_all_text` | No | No | Localized bulk action label. |
| `disable_search` | No | No | Single-select search visibility and type navigation. |
| `disable_search_threshold` | No | No | Search visibility based on option count. |
| `enable_split_word_search` | Partial | Partial | Word matching is fixed; there is no setting to require a start match. |
| `inherit_select_classes` | No | Partial | React has `className` on its host; vanilla does not copy select classes. |
| `inherit_option_classes` | No | No | Generated result classes from source options. |
| `max_selected_options` | Yes | Yes | Both enforce the limit. |
| `max_items_shown` | No | No | Collapsible selected-choice summary. |
| `paste_multiple_values` | No | No | Existing-option token paste with unmatched text preserved. |
| `more_items_text` | No | No | Selected-choice summary text callback. |
| `show_fewer_items_text` | No | No | Expanded summary button text. |
| `no_results_text` | Yes | Partial | React has `noResultsText`, but its default and punctuation differ. |
| `create_option` | No | No | New-option action; React needs a parent callback for controlled options. |
| `create_option_text` | No | No | New-option action label. |
| `persistent_create_option` | No | No | Keep creation available when results match. |
| `skip_no_results` | No | No | Hide no-results copy during creation. |
| `results_count_text` | Partial | Partial | Both announce counts with fixed English text; neither accepts the localization callback. |
| `placeholder_text_multiple` | Partial | Partial | Both have one placeholder setting rather than type-specific settings. |
| `placeholder_text` | Yes | Partial | React's `placeholder` is equivalent but has a different default and precedence. |
| `placeholder_text_single` | Partial | Partial | Both have one placeholder setting rather than type-specific settings. |
| `search_contains` | Yes | Partial | React supports it, but defaults to `true`; classic and vanilla default to `false`. |
| `highlight_prefix_matches` | No | No | Prefix-priority keyboard highlight. |
| `search_matcher` | No | No | Custom matching callback. |
| `search_input_type` | No | No | Both use a fixed text input; classic defaults to search. |
| `min_search_length` | Yes | No | Result visibility below the minimum. |
| `max_search_length` | No | No | Bound matching work while leaving input editable. |
| `normalize_search_text` | No | No | Custom normalization callback. |
| `split_search_terms` | Yes | Yes | Order-independent multi-term matching. |
| `search_delay` | No | No | Debounced results with immediate keyboard flush. |
| `search_in_values` | No | No | Search source option values. |
| `group_search` | Yes | Yes | Include group labels in matching. |
| `parser_config` | No | No | Vanilla needs source-option data copying; React needs an equivalent data model or a documented exception. |
| `backspace_deletes_choices` | Partial | Partial | Both delete the final chip; neither exposes the setting. |
| `single_backstroke_delete` | No | No | First-press chip focus, second-press removal. |
| `multiselect_allow_tab_to_select` | No | No | Tab accepts the highlighted result when enabled. |
| `open_on_label_click` | No | No | Configurable focus versus open behavior for both select types. |
| `width` | Partial | Partial | Vanilla uses CSS; React accepts `style`, with no classic width option or select measurement. |
| `dropdown_width` | No | No | Independent result width and floating presentation. |
| `recalculate_width_on_update` | No | No | Remeasure source select after an update. |
| `dropdown_position` | No | No | Fixed-position escape from clipped ancestors. |
| `display_disabled_options` | Yes | Yes | Configurable visibility. |
| `display_selected_options` | Yes | Yes | Configurable visibility. |
| `display_selected_value` | No | No | Value in the closed control; label remains in results. |
| `include_group_label_in_selected` | No | No | Group name in selected text. |
| `max_shown_results` | No | No | Limit visible result count. |
| `case_sensitive_search` | No | No | Case-sensitive matching. |
| `hide_results_on_select` | Partial | Partial | Both close single results but keep multiple results open; classic closes multiple results by default. Neither exposes the setting. |
| `rtl` | Partial | Yes | Vanilla can inherit page direction but does not copy `dir` from its select; React has `dir`. |

## Source attributes and platform events

The vanilla edition reads `data-placeholder`, native `placeholder`, and option `data-search-text`; it follows source `multiple`, `required`, `disabled`, `hidden`, selected values, reset, and native change events. It does not yet read classic option `data-*` initialization attributes, `data-chosen-always-visible`, `select-by-group`, or the full `aria-*` set. React accepts structured option data rather than parsing a source select; `searchText`, `hidden`, `disabled`, `multiple`, `required`, `readOnly`, selected values, and several ARIA props are available. Equivalent always-visible and group-selection behavior are absent.

The vanilla adapter has native `chosen:*` lifecycle events on the source select and bubbling native `input`/`change`. React has `onChange` and `onOpenChange`; it does not expose the full classic lifecycle and result event set. Neither API should pretend jQuery `.trigger()` is a native event. Compare event payloads, cancelation, form reset, keyboard navigation, pointer and touch behavior, dynamic updates, label focus, search highlighting, and accessibility in tests before calling parity complete.

## Completion gate

1. Implement the missing behavior in shared `core/` when it is independent of the renderer; keep platform-specific DOM and state code in each adapter.
2. Add adapter-specific options or props, types, docs, and demos with equivalent defaults. Where React cannot mutate a controlled options array, use an explicit callback and document the parent update.
3. Add focused cross-adapter behavior tests, browser and mobile checks for interaction changes, and representative visual checks.
4. Update this inventory to `Yes` or record a justified platform-specific equivalent for every row before treating either experimental edition as feature complete.
