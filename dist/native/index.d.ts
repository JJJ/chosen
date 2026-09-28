export interface ChosenOptions {
  aria_label?: string;
  allow_single_deselect?: boolean;
  placeholder_text?: string;
  search_placeholder?: string;
  no_results_text?: string;
  search_contains?: boolean;
  split_search_terms?: boolean;
  group_search?: boolean;
  display_selected_options?: boolean;
  display_disabled_options?: boolean;
  min_search_length?: number;
  max_selected_options?: number;
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
