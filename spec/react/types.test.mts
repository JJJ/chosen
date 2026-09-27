import { Chosen } from 'chosen-jjj/react';
import type { ChosenHandle, ChosenProps } from 'chosen-jjj/react';

const props: ChosenProps = {
  options: [{ value: 'a', label: 'Apple' }, { label: 'Other', options: [{ value: 2, label: 'Two' }] }],
  multiple: true,
  value: ['a'],
  onChange: next => { void next; }
};
const handle: ChosenHandle | undefined = undefined;
void Chosen;
void props;
void handle;
