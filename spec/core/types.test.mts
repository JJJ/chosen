import {
  filterOptions,
  normalizeOptions,
  updateSelection,
  type ChosenGroup,
  type ChosenOption,
  type FilterResult,
  type SelectionResult,
} from 'chosen-jjj/core';

const source: Array<ChosenOption | ChosenGroup> = [
  { label: 'Animals', options: [{ value: 'cat', label: 'Cat' }] },
];
const normalized = normalizeOptions(source);
const filtered: FilterResult = filterOptions(normalized, 'cat', { groupSearch: true,
  maxShownResults: 2, searchMatcher: (query, item) => item.label.includes(query) });
const selected: SelectionResult = updateSelection([], { value: 'cat' }, { multiple: true });

filtered.items.forEach((item) => {
  if (item.kind === 'option') {
    item.value.toUpperCase();
  } else {
    item.label.toUpperCase();
  }
});
selected.values.map((value) => value.toUpperCase());

// @ts-expect-error Native form values are strings.
normalizeOptions([{ value: 42 }]);
