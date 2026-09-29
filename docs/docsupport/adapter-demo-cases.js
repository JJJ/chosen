// Shared examples keep the vanilla and React demo pages comparable.
window.ChosenAdapterCases = [
  { id: 'standard-select', title: 'Standard Select', help: 'Choose a country from a single select.', options: ['United States', 'United Kingdom', 'France', 'Germany'] },
  { id: 'multiple-select', title: 'Multiple Select', help: 'Choose several countries, then remove a chip.', multiple: true, options: ['United States', 'United Kingdom', 'France', 'Germany'] },
  { id: 'optgroup-support', title: '<optgroup> Support', help: 'Search and choose an item under a group heading.', options: [
    { label: 'Football', options: ['Bears', 'Lions', 'Packers'] }, { label: 'Baseball', options: ['Cubs', 'White Sox'] }
  ] },
  { id: 'selected-and-disabled-support', title: 'Selected, Disabled and Hidden Support', help: 'Brown Bear starts selected. Giant Panda is disabled; Sun Bear is hidden.', multiple: true, defaultValue: ['Brown Bear'], options: [
    'American Black Bear', 'Brown Bear', { label: 'Giant Panda', disabled: true }, { label: 'Sun Bear', hidden: true }, 'Polar Bear'
  ] },
  { id: 'hide-search-on-single-select', title: 'Hide Search on Single Select', help: 'Open the list and type a prefix; its search field stays hidden.', options: ['Spring', 'Summer', 'Autumn', 'Winter'], native: { disable_search_threshold: 4 }, react: { disableSearchThreshold: 4 } },
  { id: 'default-text-support', title: 'Default Text Support', help: 'The placeholder appears until an item is chosen.', placeholder: 'Choose a project...', options: ['Atlas', 'Beacon', 'Comet'] },
  { id: 'no-results-text-support', title: 'No Results Text Support', help: 'Type an unmatched query to see custom copy.', options: ['Apple', 'Banana', 'Cherry'], native: { no_results_text: 'Nothing found for:' }, react: { noResultsText: 'Nothing found for:' } },
  { id: 'limit-selected-options-in-multiselect', title: 'Limit Selected Options in Multiselect', help: 'Try to choose a third item after selecting two.', multiple: true, options: ['Atlas', 'Beacon', 'Comet', 'Delta'], native: { max_selected_options: 2 }, react: { maxSelectedOptions: 2 } },
  { id: 'summarize-selected-choices', title: 'Summarize Selected Choices', help: 'Choose three or more items, then expand and reduce the visible chips.', multiple: true, options: ['Atlas', 'Beacon', 'Comet', 'Delta'], native: { max_items_shown: 2 }, react: { maxItemsShown: 2 } },
  { id: 'paste-multiple-values', title: 'Paste Multiple Choices', help: 'Paste “Atlas, Beacon; Comet” into the search field.', multiple: true, options: ['Atlas', 'Beacon', 'Comet', 'Delta'], native: { paste_multiple_values: true }, react: { pasteMultipleValues: true } },
  { id: 'select-all-actions', title: 'Select All and Deselect All', help: 'Use the action rows or the Command/Ctrl keyboard shortcuts.', multiple: true, options: ['Atlas', 'Beacon', 'Comet', 'Delta'], native: { allow_select_all: true, allow_deselect_all: true }, react: { allowSelectAll: true, allowDeselectAll: true } },
  { id: 'allow-deselect-on-single-selects', title: 'Allow Deselect on Single Selects', help: 'Choose an item and use the clear button.', options: ['Apple', 'Banana', 'Cherry'], native: { allow_single_deselect: true }, react: { allowSingleDeselect: true } },
  { id: 'right-to-left-support', title: 'Right-to-Left Support', help: 'The control and results follow right-to-left direction.', dir: 'rtl', options: ['Alpha', 'Beta', 'Gamma'] },
  { id: 'change-update-events', title: 'Observing, Updating, and Destroying Chosen', help: 'Add an option, then destroy and rebuild the control.', dynamic: true, options: ['Alpha', 'Beta'] },
  { id: 'relative-size-support', title: 'Relative Sizing', help: 'The control follows CSS width and its icon uses a rem token.', className: 'adapter-case-relative', options: ['Small', 'Medium', 'Large'], native: { width: false }, react: { width: false } },
  { id: 'initialization-defaults', title: 'Shared Initialization Defaults', help: 'Pass a placeholder when creating this control; the other controls keep their own settings.', options: ['Alpha', 'Beta'], native: { placeholder_text: 'Choose a default...' }, react: { placeholder: 'Choose a default...' } },
  { id: 'data-attribute-options', title: 'Options from Data Attributes', help: 'Vanilla reads select data attributes; React passes the equivalent as props.', dataOptions: true, options: ['Atlas', 'Beacon', 'Comet'], react: { disableSearch: true, allowSingleDeselect: true } },
  { id: 'custom-width-support', title: 'Custom Width Support', help: 'The dropdown is wider than its control.', options: ['Atlas Product Design Team', 'Beacon Engineering Group', 'Comet'], native: { width: '12rem', dropdown_width: '18rem' }, react: { width: '12rem', dropdownWidth: '18rem' } },
  { id: 'clipped-dropdowns', title: 'Dropdowns in clipped containers', help: 'The fixed dropdown escapes this clipped frame.', className: 'adapter-case-clipped', options: ['Alpha', 'Beta', 'Gamma', 'Delta'], native: { width: '12rem', dropdown_position: 'fixed' }, react: { width: '12rem', dropdownPosition: 'fixed' } },
  { id: 'labels-work-too', title: 'Labels work, too', help: 'Click the visible label to focus or open the control.', multiple: true, options: ['Alpha', 'Beta', 'Gamma'] },
  { id: 'search-recipes', title: 'Search Aliases and Phrases', help: 'Search “maps” or “project here”.', options: [
    { label: 'Atlas mapping', searchText: 'maps cartography' }, 'The project is here', 'Here is my project'
  ], native: { search_contains: true, split_search_terms: true }, react: { searchContains: true, splitSearchTerms: true } },
  { id: 'prefix-highlight', title: 'Prefer Prefix Matches', help: 'Search “here” and compare the highlighted result with the list order.', options: ['The project is here', 'Here is my project', 'The Café is here'], native: { search_contains: true, highlight_prefix_matches: true }, react: { searchContains: true, highlightPrefixMatches: true } },
  { id: 'create-options', title: 'Create an Option from Search', help: 'Type a new value and press Enter.', multiple: true, options: ['Atlas', 'Beacon'], native: { create_option: true }, react: { createOption: true } },
  { id: 'selected-result-actions', title: 'Review Selected Results', help: 'Choose an item, reopen the list, and remove it from its result row.', multiple: true, options: ['Atlas', 'Beacon', 'Comet'], native: { deselect_selected_results: true, hide_results_on_select: false }, react: { deselectSelectedResults: true, hideResultsOnSelect: false } },
  { id: 'group-and-readonly', title: 'Group Selection and Readonly', help: 'Click a group heading to select its enabled items. This example can be made read-only.', multiple: true, groupAction: true, options: [
    { label: 'Design', options: ['Research', 'Typography'] }, { label: 'Engineering', options: ['JavaScript', 'Testing'] }
  ], native: { hide_results_on_select: false }, react: { hideResultsOnSelect: false, selectByGroup: true } },
  { id: 'validation-styling', title: 'Validation Styling', help: 'Use Check validity without selecting an item to see the invalid state.', required: true, options: ['Atlas', 'Beacon'] }
];
