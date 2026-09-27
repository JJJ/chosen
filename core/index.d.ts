/** Experimental data APIs shared by Chosen editions. The React MVP may refine these types. */

export interface ChosenOption {
  value: string;
  label?: string;
  searchText?: string;
  selected?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}

export interface ChosenGroup {
  label: string;
  options: readonly ChosenOption[];
  disabled?: boolean;
  hidden?: boolean;
}

export interface NormalizedGroup {
  kind: 'group';
  index: number;
  label: string;
  disabled: boolean;
  hidden: boolean;
}

export interface NormalizedOption {
  kind: 'option';
  index: number;
  value: string;
  label: string;
  empty: boolean;
  searchText: string;
  selected: boolean;
  disabled: boolean;
  hidden: boolean;
  groupIndex: number | null;
  groupLabel: string | null;
}

export type NormalizedEntry = NormalizedGroup | NormalizedOption;

export interface ResultSettings {
  multiple?: boolean;
  displaySelectedOptions?: boolean;
  displayDisabledOptions?: boolean;
  groupHidden?: boolean;
}

export interface SearchSettings extends ResultSettings {
  caseSensitiveSearch?: boolean;
  createSearchRegex?: (escapedQuery: string) => RegExp;
  enableSplitWordSearch?: boolean;
  foldAccents?: (text: string) => string;
  groupSearch?: boolean;
  maxSearchLength?: number;
  minSearchLength?: number;
  normalizeSearchText?: (text: string) => string;
  searchContains?: boolean;
  searchInValues?: boolean;
  searchStringMatch?: (text: string, regex: RegExp) => RegExpExecArray | null;
  splitSearchTerms?: boolean;
}

export interface MatchInput {
  label: string;
  value?: string;
  searchText?: string;
  exactText?: string;
}

export interface MatchResult {
  matched: boolean;
  alternate: boolean;
  normalizedText: string;
  primaryMatch: RegExpExecArray | null;
  termMatches: Array<RegExpExecArray | null>;
  exact: boolean;
}

export type Matcher = ((option: MatchInput) => MatchResult) & { terms: string[] };

export interface FilterResult {
  items: NormalizedEntry[];
  count: number;
  exactMatch: boolean;
}

export interface SelectionSettings {
  multiple?: boolean;
  maxSelectedOptions?: number;
  disabled?: boolean;
  readOnly?: boolean;
  action?: 'select' | 'remove';
}

export interface SelectionResult {
  values: string[];
  changed: boolean;
  limitReached: boolean;
}

export function foldAccents(value: string): string;
export function normalizeOptions(entries: readonly (ChosenOption | ChosenGroup)[]): NormalizedEntry[];
export function includeOptionInResults(option: Pick<NormalizedOption, 'selected' | 'disabled' | 'hidden'> & { empty?: boolean }, settings?: ResultSettings): boolean;
export function selectionLimitReached(selectedCount: number, maximum?: number): boolean;
export function canSelectOption(option: ChosenOption | NormalizedOption, selectedValues: readonly string[], settings?: SelectionSettings): boolean;
export function updateSelection(selectedValues: readonly string[], option: ChosenOption | NormalizedOption, settings?: SelectionSettings): SelectionResult;
export function createMatcher(query: string, settings?: SearchSettings): Matcher;
export function filterOptions(entries: readonly (ChosenOption | ChosenGroup)[] | readonly NormalizedEntry[], query: string, settings?: SearchSettings): FilterResult;
