import type { CSSProperties, FocusEvent, ForwardRefExoticComponent, RefAttributes, SyntheticEvent } from 'react';
import type { NormalizedEntry } from 'chosen-jjj/core';

export interface ChosenOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  hidden?: boolean;
  searchText?: string;
  alwaysVisible?: boolean;
  className?: string;
  dataAttributes?: Record<string, string>;
}

export interface ChosenGroup {
  label: string;
  className?: string;
  disabled?: boolean;
  hidden?: boolean;
  options: ChosenOption[];
}

export interface ChosenHandle {
  focus(): void;
  blur(): void;
  open(): void;
  close(): void;
}

export interface ChosenProps {
  options: Array<ChosenOption | ChosenGroup>;
  multiple?: boolean;
  openOnLabelClick?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[], event: SyntheticEvent) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onReady?: () => void;
  onShowingDropdown?: () => void;
  onHidingDropdown?: () => void;
  onSearch?: (query: string) => void;
  onSearchUpdated?: (query: string) => void;
  onNoResults?: (query: string) => void;
  onNoResultsClear?: (query: string) => void;
  onMaxSelected?: () => void;
  name?: string;
  form?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  placeholderTextSingle?: string;
  placeholderTextMultiple?: string;
  allowSingleDeselect?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  noResultsTemplate?: string;
  createOption?: boolean;
  createOptionText?: string;
  persistentCreateOption?: boolean;
  skipNoResults?: boolean;
  onCreateOption?: (query: string, event: SyntheticEvent) => ChosenOption | false | void;
  resultsCountText?: (count: number) => string;
  inheritOptionClasses?: boolean;
  inheritOptgroupClasses?: boolean;
  copyOptionDataAttributes?: boolean;
  maxSelectedOptions?: number;
  maxItemsShown?: number;
  allowSelectAll?: boolean;
  allowDeselectAll?: boolean;
  selectByGroup?: boolean;
  pasteMultipleValues?: boolean;
  searchDelay?: number;
  selectAllText?: string;
  deselectAllText?: string;
  moreItemsText?: (count: number) => string;
  showFewerItemsText?: string;
  backspaceDeletesChoices?: boolean;
  singleBackstrokeDelete?: boolean;
  multiselectAllowTabToSelect?: boolean;
  searchInputType?: 'search' | 'text';
  disableSearch?: boolean;
  disableSearchThreshold?: number;
  searchContains?: boolean;
  highlightPrefixMatches?: boolean;
  enableSplitWordSearch?: boolean;
  caseSensitiveSearch?: boolean;
  searchInValues?: boolean;
  maxSearchLength?: number;
  minSearchLength?: number;
  maxShownResults?: number;
  normalizeSearchText?: (text: string) => string;
  searchMatcher?: (query: string, item: NormalizedEntry) => boolean;
  splitSearchTerms?: boolean;
  groupSearch?: boolean;
  displaySelectedOptions?: boolean;
  deselectSelectedResults?: boolean;
  hideResultsOnSelect?: boolean;
  displayDisabledOptions?: boolean;
  displaySelectedValue?: boolean;
  includeGroupLabelInSelected?: boolean;
  width?: string | number | false;
  dropdownWidth?: string | number;
  dropdownPosition?: 'absolute' | 'fixed';
  dir?: 'ltr' | 'rtl';
  id?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
}

export declare const Chosen: ForwardRefExoticComponent<ChosenProps & RefAttributes<ChosenHandle>>;
export default Chosen;
