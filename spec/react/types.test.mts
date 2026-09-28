import { Chosen } from 'chosen-jjj/react';
import type { ChosenHandle, ChosenProps } from 'chosen-jjj/react';

const props: ChosenProps = {
  options: [{ value: 'a', label: 'Apple' }, { label: 'Other', options: [{ value: 2, label: 'Two' }] }],
  multiple: true,
  value: ['a'],
  placeholderTextMultiple: 'Choose several',
  backspaceDeletesChoices: false, multiselectAllowTabToSelect: true,
  searchInValues: true,
  maxShownResults: 20,
  searchMatcher: (query, item) => item.kind === 'option' && item.value === query,
  onChange: next => { void next; }
};
const handle: ChosenHandle | undefined = undefined;
void Chosen;
void props;
void handle;
