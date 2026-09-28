describe "Initialization defaults", ->
  previous_defaults = null

  beforeEach ->
    previous_defaults = $.fn.chosen.defaults
    $.fn.chosen.defaults = {}

  afterEach ->
    $.fn.chosen.defaults = previous_defaults

  it "uses shared defaults only for later instances and lets local options win", ->
    div = $("<div><select class='shared'><option value=''></option><option>One</option></select><select class='local'><option value=''></option><option>Two</option></select><select class='later'><option value=''></option><option>Three</option></select></div>").appendTo("body")
    $.fn.chosen.defaults = {placeholder_text_single: "Shared prompt", disable_search: true}

    div.find(".shared").chosen()
    shared = div.find(".shared").data("chosen")
    expect(shared.default_text).toBe("Shared prompt")
    expect(shared.disable_search).toBe(true)

    div.find(".local").chosen(placeholder_text_single: "Local prompt", disable_search: false)
    local = div.find(".local").data("chosen")
    expect(local.default_text).toBe("Local prompt")
    expect(local.disable_search).toBe(false)

    $.fn.chosen.defaults.placeholder_text_single = "Later prompt"
    div.find(".later").chosen()
    expect(div.find(".later").data("chosen").default_text).toBe("Later prompt")
    expect(shared.options.placeholder_text_single).toBe("Shared prompt")
    div.remove()

  it "keeps the supplied options object when no shared defaults are set", ->
    div = $("<div><select><option>One</option></select></div>").appendTo("body")
    options = {disable_search: true}
    div.find("select").chosen(options)
    expect(div.find("select").data("chosen").options).toBe(options)
    div.remove()

  it "reads supported select data attributes per control between defaults and explicit options", ->
    div = $("<div><select class='first' data-disable-search='false' data-allow-single-deselect='true' data-search-delay='15' data-search-input-type='text' data-placeholder-text-single='From attribute'><option value=''></option><option>One</option></select><select class='second' data-disable-search='true' data-width='false' data-no-results-text='Nothing here'><option value=''></option><option>Two</option></select></div>").appendTo("body")
    $.fn.chosen.defaults = {disable_search: true, search_delay: 5}
    div.find('select').chosen()
    first = div.find('.first').data('chosen')
    second = div.find('.second').data('chosen')

    expect(first.disable_search).toBe(false)
    expect(first.allow_single_deselect).toBe(true)
    expect(first.search_delay).toBe(15)
    expect(first.search_input_type).toBe('text')
    expect(first.default_text).toBe('From attribute')
    expect(second.disable_search).toBe(true)
    expect(second.search_delay).toBe(5)
    expect(second.options.width).toBe(false)
    expect(second.results_none_found).toBe('Nothing here')
    div.remove()

  it "keeps explicit options above data attributes and ignores invalid or unsupported values", ->
    div = $("<div><select data-disable-search='true' data-max-items-shown='2.5' data-search-delay='-1' data-search-matcher='javascript' data-search-input-type='password' data-no-results-text='New text' data-no_results_text='Legacy text'><option>One</option></select></div>").appendTo("body")
    options = {disable_search: false}
    div.find('select').chosen(options)
    chosen = div.find('select').data('chosen')

    expect(chosen.disable_search).toBe(false)
    expect(chosen.max_items_shown).toBe(Infinity)
    expect(chosen.search_delay).toBe(0)
    expect(chosen.search_matcher).toBe(null)
    expect(chosen.search_input_type).toBe('search')
    expect(chosen.results_none_found).toBe('Legacy text')
    expect(options).toEqual({disable_search: false})
    div.remove()
