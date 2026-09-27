document.observe('dom:loaded', function(evt) {
  var config = {
    '.chosen-select'           : { create_option: true, skip_no_results: true },
    '.chosen-select-deselect'  : { allow_single_deselect: true },
    '.chosen-select-bulk'      : { allow_select_all: true, allow_deselect_all: true, hide_results_on_select: false, width: '100%' },
    '.chosen-select-summary'   : { max_items_shown: 2, width: '100%' },
    '.chosen-select-no-single' : { disable_search_threshold: 10 },
    '.chosen-select-no-results': { no_results_text: 'Oops, nothing found!' },
    '.chosen-select-rtl'       : { rtl: true },
    '.chosen-select-width'     : { width: '95%' }
  }
  
  for (var selector in config) {
    config[selector].open_on_label_click = false;
    $$(selector).each(function(element) {
      new Chosen(element, config[selector]);
    });
  }
});
