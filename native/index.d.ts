export interface ChosenOptions {
  aria_label?: string;
  allow_single_deselect?: boolean;
  placeholder_text?: string;
  placeholder_text_single?: string;
  placeholder_text_multiple?: string;
  search_placeholder?: string;
  no_results_text?: string;
  search_contains?: boolean;
  highlight_prefix_matches?: boolean;
  enable_split_word_search?: boolean;
  case_sensitive_search?: boolean;
  search_in_values?: boolean;
  max_search_length?: number;
  normalize_search_text?: (text: string) => string;
  search_matcher?: (query: string, item: { kind: 'option' | 'group'; label: string; value?: string }) => boolean;
  max_shown_results?: number;
  split_search_terms?: boolean;
  group_search?: boolean;
  display_selected_options?: boolean;
  display_disabled_options?: boolean;
  min_search_length?: number;
  max_selected_options?: number;
  backspace_deletes_choices?: boolean;
  multiselect_allow_tab_to_select?: boolean;
  search_input_type?: 'search' | 'text';
  rtl?: boolean;
  inherit_select_classes?: boolean;
  inherit_option_classes?: boolean;
  results_count_text?: (count: number) => string;
  display_selected_value?: boolean;
  include_group_label_in_selected?: boolean;
}

export declare class Chosen {
  constructor(select: HTMLSelectElement, options?: ChosenOptions);
  readonly select: HTMLSelectElement;
  readonly host: HTMLElement;
  readonly input: HTMLInputElement;
  readonly opened: boolean;
  update(): void;
  open(): void;
  close(): void;
  clear(): void;
  focus(): void;
  blur(): void;
  destroy(): void;
}
export default Chosen;
