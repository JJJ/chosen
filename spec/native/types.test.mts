import { Chosen, type ChosenOptions } from 'chosen-jjj/native';
const options: ChosenOptions = { search_contains: true, max_selected_options: 3,
  search_in_values: true, max_shown_results: 20,
  search_matcher: (query, item) => item.kind === 'option' && item.value === query };
const select = document.createElement('select');
const chosen = new Chosen(select, options);
chosen.update();
chosen.open();
chosen.close();
chosen.clear();
chosen.destroy();
