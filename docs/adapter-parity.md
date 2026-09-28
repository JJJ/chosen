# Adapter feature parity

Chosen's jQuery and Prototype adapters define the current behavior in [Options and API](options.html). The vanilla JavaScript and React editions are experimental. **Neither is a drop-in replacement yet.** This inventory is based on the source and public APIs on 2026-09-28; keep it current when behavior changes.

The goal is equivalent behavior and defaults in all editions, expressed through each platform's natural API. React props can use camelCase and callbacks; vanilla can use native DOM events. An adapter-specific mechanism is acceptable only when users can achieve the same result. Avoid changing an existing default silently; document a migration or release boundary when aligning one.

`Yes` means the option has equivalent configurable behavior. `Partial` means some behavior exists but the setting, default, or an important edge case differs. `No` means the public adapter does not implement it. The jQuery and Prototype columns are omitted because the classic reference is the baseline, not because their individual tests can be skipped.

| Classic option | Vanilla | React | Gap or equivalent API |
| --- | --- | --- | --- |
| `allow_single_deselect` | Yes | Yes | React prop: `allowSingleDeselect`, default `false`. |
| `allow_select_all` | Yes | Yes | Filtered bulk selection with Ctrl/Command+A on an empty search. React prop: `allowSelectAll`. |
| `allow_deselect_all` | Yes | Yes | Clear enabled selections with Ctrl/Command+Shift+A on an empty search. React prop: `allowDeselectAll`. |
| `deselect_selected_results` | Yes | Yes | React prop: `deselectSelectedResults`; defaults to `false`. Both demos opt in to selected-row removal. |
| `select_all_text` | Yes | Yes | Bulk action label; React prop: `selectAllText`. |
| `deselect_all_text` | Yes | Yes | Bulk action label; React prop: `deselectAllText`. |
| `disable_search` | Yes | Yes | Single-select search is hidden; typing prefixes navigates results. React prop: `disableSearch`. |
| `disable_search_threshold` | Yes | Yes | Hide single-select search at or below the option count. React prop: `disableSearchThreshold`. |
| `enable_split_word_search` | Yes | Yes | React prop: `enableSplitWordSearch`. |
| `inherit_select_classes` | Yes | Yes | Vanilla opts into copying source classes; React uses `className` directly on its generated host. |
| `inherit_option_classes` | Yes | Yes | Option and group classes reach result rows; opt in to copying option classes to selected chips. React uses `className` on option data and `inheritOptionClasses`. |
| `max_selected_options` | Yes | Yes | Both enforce the limit. |
| `max_items_shown` | Yes | Yes | Positive integer limit for visible chips; React prop: `maxItemsShown`. |
| `paste_multiple_values` | No | No | Existing-option token paste with unmatched text preserved. |
| `more_items_text` | Yes | Yes | Hidden-choice count callback; React prop: `moreItemsText`. |
| `show_fewer_items_text` | Yes | Yes | Expanded summary button copy; React prop: `showFewerItemsText`. |
| `no_results_text` | Yes | Yes | React prop: `noResultsText`; custom text is used literally before the query. Vanilla also reads source `data-no_results_text`. |
| `create_option` | No | No | New-option action; React needs a parent callback for controlled options. |
| `create_option_text` | No | No | New-option action label. |
| `persistent_create_option` | No | No | Keep creation available when results match. |
| `skip_no_results` | No | No | Hide no-results copy during creation. |
| `results_count_text` | Yes | Yes | React prop: `resultsCountText`; both accept `(count) => text` for the live result count. |
| `placeholder_text_multiple` | Yes | Yes | React prop: `placeholderTextMultiple`. |
| `placeholder_text` | Yes | Yes | React prop: `placeholder`; type-specific props take precedence. |
| `placeholder_text_single` | Yes | Yes | React prop: `placeholderTextSingle`. |
| `search_contains` | Yes | Yes | React now defaults to `false`, matching classic. |
| `highlight_prefix_matches` | Yes | Yes | React prop: `highlightPrefixMatches`; result order is unchanged. |
| `search_matcher` | Yes | Yes | React prop: `searchMatcher`; both receive normalized items. |
| `search_input_type` | Yes | Yes | Both default to `search` and accept `text`; React prop: `searchInputType`. |
| `min_search_length` | Yes | Yes | React prop: `minSearchLength`. |
| `max_search_length` | Yes | Yes | React prop: `maxSearchLength`; both default to 1000. |
| `normalize_search_text` | Yes | Yes | React prop: `normalizeSearchText`. |
| `split_search_terms` | Yes | Yes | Order-independent multi-term matching. |
| `search_delay` | No | No | Debounced results with immediate keyboard flush. |
| `search_in_values` | Yes | Yes | React prop: `searchInValues`. |
| `group_search` | Yes | Yes | Include group labels in matching. |
| `parser_config` | No | No | Vanilla needs source-option data copying; React needs an equivalent data model or a documented exception. |
| `backspace_deletes_choices` | Yes | Yes | React prop: `backspaceDeletesChoices`; defaults to `true`. |
| `single_backstroke_delete` | Yes | Yes | React prop: `singleBackstrokeDelete`; set `false` for first-press chip focus and second-press removal. |
| `multiselect_allow_tab_to_select` | Yes | Yes | React prop: `multiselectAllowTabToSelect`; defaults to `false`. Tab continues to the next focus target. |
| `open_on_label_click` | Yes | Yes | React prop: `openOnLabelClick`; labels focus singles and open multiples by default, with either behavior configurable. |
| `width` | Partial | Partial | Vanilla uses CSS; React accepts `style`, with no classic width option or select measurement. |
| `dropdown_width` | No | No | Independent result width and floating presentation. |
| `recalculate_width_on_update` | No | No | Remeasure source select after an update. |
| `dropdown_position` | No | No | Fixed-position escape from clipped ancestors. |
| `display_disabled_options` | Yes | Yes | Configurable visibility. |
| `display_selected_options` | Yes | Yes | Configurable visibility. |
| `display_selected_value` | Yes | Yes | Value in the closed control; label remains in results. React prop: `displaySelectedValue`. |
| `include_group_label_in_selected` | Yes | Yes | Group name in selected text. React prop: `includeGroupLabelInSelected`. |
| `max_shown_results` | Yes | Yes | React prop: `maxShownResults`; group headings do not count. |
| `case_sensitive_search` | Yes | Yes | React prop: `caseSensitiveSearch`. |
| `hide_results_on_select` | Yes | Yes | React prop: `hideResultsOnSelect`; defaults to `true`. Both demos keep multiple results open with the opt-out. |
| `rtl` | Yes | Yes | Vanilla accepts `rtl: true` and follows source `dir` or the legacy `chosen-rtl` class; React has `dir`. |

## Source attributes and platform events

The vanilla edition reads `data-placeholder`, native `placeholder`, and option `data-search-text`; it follows source `multiple`, `required`, `disabled`, `hidden`, selected values, reset, and native change events. It does not yet read classic option `data-*` initialization attributes, `data-chosen-always-visible`, `select-by-group`, or the full `aria-*` set. React accepts structured option data rather than parsing a source select; `searchText`, `hidden`, `disabled`, `multiple`, `required`, `readOnly`, selected values, and several ARIA props are available. Equivalent always-visible and group-selection behavior are absent.

The vanilla adapter has native `chosen:*` lifecycle events on the source select and bubbling native `input`/`change`. React has `onChange` and `onOpenChange`; it does not expose the full classic lifecycle and result event set. Neither API should pretend jQuery `.trigger()` is a native event. Compare event payloads, cancelation, form reset, keyboard navigation, pointer and touch behavior, dynamic updates, label focus, search highlighting, and accessibility in tests before calling parity complete.

## Completion gate

1. Implement the missing behavior in shared `core/` when it is independent of the renderer; keep platform-specific DOM and state code in each adapter.
2. Add adapter-specific options or props, types, docs, and demos with equivalent defaults. Where React cannot mutate a controlled options array, use an explicit callback and document the parent update.
3. Add focused cross-adapter behavior tests, browser and mobile checks for interaction changes, and representative visual checks.
4. Update this inventory to `Yes` or record a justified platform-specific equivalent for every row before treating either experimental edition as feature complete.
