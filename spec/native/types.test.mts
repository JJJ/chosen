import { Chosen, type ChosenOptions } from 'chosen-jjj/native';
const options: ChosenOptions = { search_contains: true, max_selected_options: 3,
  placeholder_text_multiple: 'Choose several',
  backspace_deletes_choices: false, multiselect_allow_tab_to_select: true,
  search_input_type: 'text',
  rtl: true,
  display_selected_value: true, include_group_label_in_selected: true,
  search_in_values: true, max_shown_results: 20,
  search_matcher: (query, item) => item.kind === 'option' && item.value === query };
const select = document.createElement('select');
const chosen = new Chosen(select, options);
chosen.update();
chosen.open();
chosen.close();
chosen.clear();
chosen.destroy();
