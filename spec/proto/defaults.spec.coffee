describe "Initialization defaults", ->
  previous_defaults = null

  beforeEach ->
    previous_defaults = Chosen.defaults
    Chosen.defaults = {}

  afterEach ->
    Chosen.defaults = previous_defaults

  it "uses shared defaults only for later instances and lets local options win", ->
    div = new Element("div").update("<select class='shared'><option value=''></option><option>One</option></select><select class='local'><option value=''></option><option>Two</option></select><select class='later'><option value=''></option><option>Three</option></select>")
    document.body.appendChild(div)
    Chosen.defaults = {placeholder_text_single: "Shared prompt", disable_search: true}

    shared = new Chosen(div.down("select.shared"))
    expect(shared.default_text).toBe("Shared prompt")
    expect(shared.disable_search).toBe(true)

    local = new Chosen(div.down("select.local"), placeholder_text_single: "Local prompt", disable_search: false)
    expect(local.default_text).toBe("Local prompt")
    expect(local.disable_search).toBe(false)

    Chosen.defaults.placeholder_text_single = "Later prompt"
    later = new Chosen(div.down("select.later"))
    expect(later.default_text).toBe("Later prompt")
    expect(shared.options.placeholder_text_single).toBe("Shared prompt")
    div.remove()

  it "keeps the supplied options object when no shared defaults are set", ->
    div = new Element("div").update("<select><option>One</option></select>")
    document.body.appendChild(div)
    options = {disable_search: true}
    chosen = new Chosen(div.down("select"), options)
    expect(chosen.options).toBe(options)
    div.remove()

  it "reads typed select data attributes and keeps explicit options authoritative", ->
    div = new Element("div").update("<select data-disable-search='true' data-allow-single-deselect='true' data-search-delay='15' data-search-input-type='text' data-placeholder-text-single='From attribute' data-max-items-shown='2.5' data-search-matcher='javascript'><option value=''></option><option>One</option></select>")
    document.body.appendChild(div)
    Chosen.defaults = {disable_search: true, search_delay: 5}
    chosen = new Chosen(div.down('select'), disable_search: false)

    expect(chosen.disable_search).toBe(false)
    expect(chosen.allow_single_deselect).toBe(true)
    expect(chosen.search_delay).toBe(15)
    expect(chosen.search_input_type).toBe('text')
    expect(chosen.default_text).toBe('From attribute')
    expect(chosen.max_items_shown).toBe(Infinity)
    expect(chosen.search_matcher).toBe(null)
    div.remove()
