var config = {
  '.chosen-select'           : { create_option: true, skip_no_results: true },
  '.chosen-select-deselect'  : { allow_single_deselect: true },
  '.chosen-select-bulk'      : { allow_select_all: true, allow_deselect_all: true, hide_results_on_select: false, width: '100%' },
  '.chosen-select-summary'   : { max_items_shown: 2, width: '100%' },
  '.chosen-select-paste'     : { paste_multiple_values: true, width: '100%' },
  '.chosen-select-search-recipe': { split_search_terms: true, min_search_length: 2, normalize_search_text: function(text) { return text.normalize ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text.replace(/[éèêë]/g, 'e'); }, width: '100%' },
  '.chosen-select-prefix-recipe': { enable_split_word_search: false, search_contains: true, width: '100%' },
  '.chosen-select-contains-demo': { search_contains: true, width: '100%' },
  '.chosen-select-prefix-highlight': { search_contains: true, highlight_prefix_matches: true, width: '100%' },
  '.chosen-select-other-recipe': { width: '100%' },
  '.chosen-select-matcher-recipe': { search_matcher: function(query, item) { return !item.group && item.value.indexOf('SKU-') === 0 && item.text.toLowerCase().indexOf(query.toLowerCase()) !== -1; }, width: '100%' },
  '.chosen-select-create-recipe': { create_option: true, persistent_create_option: true, skip_no_results: true, width: '100%' },
  '.chosen-select-selected-recipe': { display_selected_value: true, deselect_selected_results: true, hide_results_on_select: false, width: '100%' },
  '.chosen-select-group-recipe': { width: '100%' },
  '.chosen-select-readonly-recipe': { width: '100%' },
  '.chosen-select-invalid-recipe': { width: '100%' },
  '.chosen-select-relative-size': { width: '100%' },
  '.chosen-select-css-width': { width: false },
  '.chosen-select-dropdown-width': { width: '180px', dropdown_width: '300px' },
  '.chosen-select-update-width': { recalculate_width_on_update: true },
  '.chosen-select-fixed-dropdown': { width: '240px', dropdown_position: 'fixed' },
  '.chosen-select-no-single' : { disable_search_threshold: 10 },
  '.chosen-select-no-results': { no_results_text: 'Oops, nothing found!' },
  '.chosen-select-rtl'       : { rtl: true },
  '.chosen-select-width'     : { width: '95%' }
}
for (var selector in config) {
  config[selector].open_on_label_click = false;
  $(selector).chosen(config[selector]);
}
var previousChosenDefaults = $.fn.chosen.defaults;
$.fn.chosen.defaults = { placeholder_text_single: 'Shared prompt' };
$('.chosen-select-shared-defaults').chosen();
$('.chosen-select-local-defaults').chosen({ placeholder_text_single: 'Local prompt' });
$.fn.chosen.defaults = previousChosenDefaults;
$('.chosen-select-data-options').chosen();

$('#width-update-add').on('click', function() {
  var select = $('#width-update');
  if (!select.find('option[value="long"]').length) {
    select.append(new Option('A longer project name', 'long'));
  }
  select.trigger('chosen:updated');
});
$('#recipe-other').on('change', function() {
  var isOther = this.value === 'other';
  $('#other-detail').prop('hidden', !isOther);
  if (!isOther) $('#other-country').val('');
});
